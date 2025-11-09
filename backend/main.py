from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import datetime
from passlib.hash import bcrypt
from passlib.context import CryptContext

# Create a password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import requests
from openai import OpenAI



router = APIRouter()
# ==================================
# SETUP
# ==================================
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = FastAPI(title="BrightPath API", version="1.0")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Include router (for future modular routes)
app.include_router(router)

# ✅ CORS middleware — make sure it catches preflight (OPTIONS) requests
origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://brightpath-six.vercel.app/",  # 👈 your Vercel frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================
# MODELS
# ==================================
class Teacher(BaseModel):
    name: str
    email: str
    password: str

class Student(BaseModel):
    name: str
    gender: str | None = None
    date_of_birth: str | None = None  # replaces 'dob'
    grade: str                        # new field


class Parent(BaseModel):
    name: str
    email: str
    phone: str | None = None

class Subject(BaseModel):
    name: str
    description: str | None = None

class TeacherSubject(BaseModel):
    teacher_id: int
    subject_id: int

class Admin(BaseModel):
    name: str
    email: str
    password: str
class TeacherSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: str | None = None
    subjects: list[str]
    grades: list[str]   
class Announcement(BaseModel):
    message: str
    posted_by: str | None = None  # optional admin name     

# ==================================
# ROUTES
# ==================================

@app.get("/")
def home():
    return {"success": True, "message": "BrightPath backend running fine 🎉"}

from passlib.hash import bcrypt

class LoginRequest(BaseModel):
    email: str
    password: str
# @app.options("/{path:path}")
# async def preflight_handler(path: str):
#     """
#     Handles all OPTIONS requests explicitly for debugging.
#     """
#     from fastapi.responses import JSONResponse
#     response = JSONResponse(content={"message": "Preflight OK"})
#     response.headers["Access-Control-Allow-Origin"] = "*"
#     response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
#     response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
#     return response
@app.post("/add-announcement")
async def add_announcement(data: Announcement):
    try:
        res = supabase.table("announcements").insert({
            "message": data.message,
            "posted_by": data.posted_by or "Admin"
        }).execute()
        return {"success": True, "message": "Announcement posted successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get-announcements")
async def get_announcements():
    res = supabase.table("announcements").select("*").order("created_at", desc=True).execute()
    return {"success": True, "announcements": res.data}
@app.post("/login")
def login_user(credentials: LoginRequest):
    try:
        email = credentials.email
        password = credentials.password

        # 1️⃣ Check users table first (for admin / teacher)
        result = supabase.table("users").select("*").eq("email", email).execute()

        if result.data:
            user = result.data[0]
            if not bcrypt.verify(password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid email or password")

            return {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }

        # 2️⃣ If not found, check parents table
        parent_result = supabase.table("parents").select("*").eq("email", email).execute()

        if not parent_result.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        parent = parent_result.data[0]
        if not bcrypt.verify(password, parent["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # 3️⃣ Return parent info
        return {
            "id": parent["id"],
            "name": parent["name"],
            "email": parent["email"],
            "role": "parent"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------ ADD ------------------
from passlib.hash import bcrypt  # make sure this import is at the top
@app.post("/add-admin")
def add_admin(admin: Admin):
    try:
        hashed_password = bcrypt.hash(admin.password)
        response = supabase.table("users").insert({
            "name": admin.name,
            "email": admin.email,
            "password_hash": hashed_password,
            "role": "admin"
        }).execute()
        return {"success": True, "message": "Admin added successfully!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ------------------ ADMIN ROUTES ------------------
# ===============================
# ADMIN: COMPILE RESULTS
# ===============================
@app.post("/admin/compile-results")
def compile_results(term: str):
    """
    Aggregates results for a given term and saves per-student totals & averages.
    """
    try:
        # 1️⃣ Pull all results for the term
        results_query = supabase.table("results").select("*").eq("term", term).execute()
        results = results_query.data
        if not results:
            raise HTTPException(status_code=404, detail="No marks found for this term.")

        # 2️⃣ Group by student_id
        from collections import defaultdict
        student_totals = defaultdict(list)
        for r in results:
            student_totals[r["student_id"]].append(r["marks"])

        compiled = []
        for student_id, marks_list in student_totals.items():
            total = sum(marks_list)
            avg = round(total / len(marks_list), 2)
            compiled.append({
                "student_id": student_id,
                "term": term,
                "total_marks": total,
                "average": avg,
            })

        # 3️⃣ Upsert compiled results (avoid duplicates)
        for c in compiled:
            supabase.table("compiled_results").upsert(c).execute()

        return {
            "success": True,
            "message": f"Results compiled for {len(compiled)} students for {term}.",
            "data": compiled
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-admins")
def get_admins():
    try:
        data = supabase.table("users").select("*").eq("role", "admin").execute()
        return {"success": True, "admins": data.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/update-admin/{admin_id}")
def update_admin(admin_id: int, updated_data: dict):
    try:
        response = supabase.table("users").update(updated_data).eq("id", admin_id).execute()
        return {"success": True, "message": f"Admin with ID {admin_id} updated!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete-admin/{admin_id}")
def delete_admin(admin_id: int):
    try:
        response = supabase.table("users").delete().eq("id", admin_id).execute()
        return {"success": True, "message": f"Admin with ID {admin_id} deleted.", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/signup-teacher")
async def signup_teacher(data: TeacherSignup):
    # 1️⃣ Check if email already exists in teachers table
    existing = supabase.table("teachers").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2️⃣ Hash the password
    hashed_pw = pwd_context.hash(data.password)

    # 3️⃣ Create teacher record
    teacher_res = supabase.table("teachers").insert({
        "name": data.name,
        "email": data.email,
        "password": hashed_pw,
        "department": data.department,
        "created_at": "now()"
    }).execute()

    if not teacher_res.data:
        raise HTTPException(status_code=500, detail="Failed to create teacher")

    teacher_id = teacher_res.data[0]["id"]

    # 4️⃣ Create relationships in teacher_subjects table
    inserts = []
    for subject_id in data.subjects:
        inserts.append({
            "teacher_id": teacher_id,
            "subject_id": subject_id
        })

    if inserts:
        supabase.table("teacher_subjects").insert(inserts).execute()

    # 5️⃣ Optionally store grades in a separate table or JSON column
    # (if you have one)
    # e.g., supabase.table("teacher_grades").insert(...)

    return {
        "success": True,
        "message": f"Teacher '{data.name}' created successfully",
        "teacher_id": teacher_id,
        "subjects_assigned": data.subjects
    }
@app.post("/add-teacher")
def add_teacher(teacher: Teacher):
    try:
        # ✅ Hash the plain password before storing it
        hashed_password = bcrypt.hash(teacher.password)

        # ✅ Insert the teacher into users table with hashed password
        response = supabase.table("users").insert({
            "name": teacher.name,
            "email": teacher.email,
            "password_hash": hashed_password,
            "role": "teacher"
        }).execute()

        return {
            "success": True,
            "message": "Teacher added successfully!",
            "data": response.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summarize")
async def summarize(request: Request):
    data = await request.json()
    text = data["text"]

    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You summarize academic text in simple English for students."},
            {"role": "user", "content": text}
        ]
    )

    summary = completion.choices[0].message.content
    return {"summary": summary}
@app.post("/explain")
async def explain(request: Request):
    data = await request.json()
    concept = data["concept"]

    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a friendly tutor who explains academic concepts in simple English with examples that make them easy to understand."},
            {"role": "user", "content": f"Explain this concept clearly: {concept}"}
        ]
    )

    explanation = completion.choices[0].message.content
    return {"explanation": explanation}
@app.post("/generate-questions")
async def generate_questions(request: Request):
    data = await request.json()
    text = data.get("text", "").strip()

    if not text:
        return {"questions": "Please enter a passage or topic to generate questions from."}

    try:
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a creative exam setter. Generate 5 diverse questions from the given text. Include a mix of multiple-choice, short answer, and true/false questions, and provide their answers."},
                {"role": "user", "content": f"Generate questions from: {text}"}
            ],
            max_tokens=250,
            temperature=0.6
        )

        questions = completion.choices[0].message.content.strip()
        return {"questions": questions}

    except Exception as e:
        print("❌ ERROR:", e)
        return {"questions": f"Error: {e}"}

@app.post("/add-student")
def add_student(student: Student):
    try:
        # Data to insert — reg_no will be auto-generated in Supabase trigger
        data = {
            "name": student.name,
            "gender": student.gender,
            "date_of_birth": student.date_of_birth,
            "grade": student.grade
        }

        result = supabase.table("students").insert(data).execute()

        return {
            "success": True,
            "message": "Student added successfully",
            "data": result.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from passlib.hash import bcrypt  # ensure this is imported at the top if not already

@app.post("/add-parent")
def add_parent(parent: Parent):
    try:
        # ✅ Step 1: Hash a default password (you can change this to accept one from frontend later)
        default_password = "12345"  # temporary or frontend-provided password
        hashed_password = bcrypt.hash(default_password)

        # ✅ Step 2: Create user in 'users' table
        user_response = supabase.table("users").insert({
            "name": parent.name,
            "email": parent.email,
            "password_hash": hashed_password,
            "role": "parent"
        }).execute()

        if not user_response.data:
            raise HTTPException(status_code=500, detail="Failed to create user record.")

        user_id = user_response.data[0]["id"]

        # ✅ Step 3: Add parent info linked to that user_id
        parent_response = supabase.table("parents").insert({
            "user_id": user_id,
            "name": parent.name,
            "email": parent.email,
            "phone": parent.phone
        }).execute()

        return {
            "success": True,
            "message": "Parent added successfully and linked to user login!",
            "data": {
                "user": user_response.data,
                "parent": parent_response.data
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===============================
# PARENT SIGNUP (with admission no)
# ===============================
class ParentSignup(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    admission_no: str

@app.post("/parent/signup")
def parent_signup(data: ParentSignup):
    try:
        # 1️⃣ Check if student with that reg_no exists
        student_query = supabase.table("students").select("id").eq("reg_no", data.admission_no).execute()
        if not student_query.data:
            raise HTTPException(status_code=400, detail="Invalid admission number")

        student_id = student_query.data[0]["id"]

        # 2️⃣ Hash the password
        hashed_password = bcrypt.hash(data.password)

        # 3️⃣ Add record to 'parents' table
        parent_insert = supabase.table("parents").insert({
            "name": data.name,
            "email": data.email,
            "phone": data.phone,
            "password_hash": hashed_password
        }).execute()

        if not parent_insert.data:
            raise HTTPException(status_code=500, detail="Failed to create parent record.")

        parent_id = parent_insert.data[0]["id"]

        # 4️⃣ Link parent to child in parent_child table
        supabase.table("parent_child").insert({
            "parent_id": parent_id,
            "student_id": student_id
        }).execute()

        # 5️⃣ Return success
        return {
            "success": True,
            "message": "Parent registered and linked to student successfully.",
            "data": {
                "parent_id": parent_id,
                "student_id": student_id
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-subject")
def add_subject(subject: Subject):
    try:
        response = supabase.table("subjects").insert({
            "name": subject.name,
            "description": subject.description
        }).execute()
        return {"success": True, "message": "Subject added!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/assign-subject")
def assign_subject(link: TeacherSubject):
    try:
        response = supabase.table("teacher_subjects").insert({
            "teacher_id": link.teacher_id,
            "subject_id": link.subject_id
        }).execute()
        return {"success": True, "message": "Subject assigned to teacher!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------ VIEW ------------------
@app.get("/get-teachers")
async def get_teachers():
    result = supabase.table("teachers").select(
        "id, name, email, department, created_at, teacher_subjects(subject_id, subjects(name))"
    ).execute()

    return {"success": True, "teachers": result.data}



@app.get("/get-students")
def get_students():
    try:
        # 1️⃣ Fetch all students at once
        students_result = supabase.table("students").select("*").execute()
        students = students_result.data

        if not students:
            return {"success": True, "students": []}

        # 2️⃣ Get all student-subject links at once
        links_result = supabase.table("student_subjects").select("student_id, subject_id").execute()
        links = links_result.data

        # 3️⃣ Get all subjects at once
        subjects_result = supabase.table("subjects").select("id, name").execute()
        subjects = {s["id"]: s["name"] for s in subjects_result.data}  # dict for quick lookup

        # 4️⃣ Build a mapping: student_id → [subject names]
        from collections import defaultdict
        student_subjects_map = defaultdict(list)
        for link in links:
            subject_name = subjects.get(link["subject_id"])
            if subject_name:
                student_subjects_map[link["student_id"]].append(subject_name)

        # 5️⃣ Attach subjects to each student
        for student in students:
            student["subjects"] = student_subjects_map.get(student["id"], [])

        return {"success": True, "students": students}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ===============================
# ADD STUDENT RESULT (by teacher)
# ===============================
from fastapi import Body

@app.post("/add-result")
def add_result(data: dict = Body(...)):
    """
    Expected JSON:
    {
      "student_id": 12,
      "subject_id": 3,
      "teacher_id": 5,
      "term": "2025-T1",
      "exam_type": "Midterm",
      "marks": 84
    }
    """
    try:
        # Check for required fields
        required = ["student_id", "subject_id", "teacher_id", "term", "exam_type", "marks"]
        if not all(k in data for k in required):
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Insert into results table
        result = supabase.table("results").insert(data).execute()

        return {"success": True, "message": "Result added successfully", "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===============================
# GET LINKED STUDENTS FOR PARENT
# ===============================
@app.get("/parents/{parent_id}/students")
def get_students_for_parent(parent_id: int):
    # Step 1: get all student_ids linked to this parent
    link_response = supabase.table("parent_child") \
        .select("student_id") \
        .eq("parent_id", parent_id) \
        .execute()

    if not link_response.data:
        raise HTTPException(status_code=404, detail="No students linked to this parent.")

    # Step 2: extract all student IDs
    student_ids = [link["student_id"] for link in link_response.data]

    # Step 3: fetch full student info for those IDs
    students_response = supabase.table("students") \
        .select("reg_no, name, gender, date_of_birth, grade, created_at") \
        .in_("id", student_ids) \
        .execute()

    return {"parent_id": parent_id, "students": students_response.data}

@app.get("/get-parents")
def get_parents():
    try:
        # 1️⃣ Fetch all parents
        parents_result = supabase.table("parents").select("*").execute()
        parents = parents_result.data

        if not parents:
            return {"success": True, "parents": []}

        # 2️⃣ Fetch all parent-child links
        pc_result = supabase.table("parent_child").select("parent_id, student_id").execute()
        parent_links = pc_result.data

        # 3️⃣ Fetch all students
        students_result = supabase.table("students").select("*").execute()
        students = {s["id"]: s for s in students_result.data}

        # 4️⃣ Fetch all student-subject links
        ss_result = supabase.table("student_subjects").select("student_id, subject_id").execute()
        student_subject_links = ss_result.data

        # 5️⃣ Fetch all subjects
        subjects_result = supabase.table("subjects").select("id, name").execute()
        subjects = {s["id"]: s["name"] for s in subjects_result.data}

        # 6️⃣ Build mapping: student_id → [subject names]
        from collections import defaultdict
        student_subjects_map = defaultdict(list)
        for link in student_subject_links:
            subj_name = subjects.get(link["subject_id"])
            if subj_name:
                student_subjects_map[link["student_id"]].append(subj_name)

        # 7️⃣ Build mapping: parent_id → [children data]
        parent_children_map = defaultdict(list)
        for link in parent_links:
            child = students.get(link["student_id"])
            if child:
                child_copy = {
                    "reg_no": child["reg_no"],
                    "name": child["name"],
                    "gender": child["gender"],
                    "date_of_birth": child["date_of_birth"],
                    "grade": child["grade"],
                    "subjects": student_subjects_map.get(child["id"], [])
                }
                parent_children_map[link["parent_id"]].append(child_copy)

        # 8️⃣ Clean parent response (hide internal IDs)
        clean_parents = []
        for parent in parents:
            clean_parents.append({
                "name": parent["name"],
                "email": parent["email"],
                "phone": parent["phone"],
                "children": parent_children_map.get(parent["id"], [])
            })

        return {"success": True, "parents": clean_parents}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get-subjects")
def get_subjects():
    data = supabase.table("subjects").select("*").execute()
    return {"success": True, "subjects": data.data}

@app.get("/get-assignments")
def get_assignments():
    links = supabase.table("teacher_subjects").select("*").execute().data
    assignments = []
    for link in links:
        teacher_id = link.get("teacher_id")
        subject_id = link.get("subject_id")

        teacher = supabase.table("users").select("name").eq("id", teacher_id).execute().data
        subject = supabase.table("subjects").select("name").eq("id", subject_id).execute().data

        if teacher and subject:
            assignments.append({
                "teacher": teacher[0]["name"],
                "subject": subject[0]["name"]
            })

    return {"success": True, "assignments": assignments}

# ------------------ UPDATE ------------------
@app.put("/update-teacher/{teacher_id}")
def update_teacher(teacher_id: int, updated_data: dict):
    response = supabase.table("users").update(updated_data).eq("id", teacher_id).execute()
    return {"success": True, "message": f"Teacher with ID {teacher_id} updated!", "data": response.data}

from fastapi import Request

@app.put("/update-student/{student_id}")
async def update_student(student_id: int, request: Request):
    payload = await request.json()
    response = supabase.table("students").update({
        "name": payload["name"],
        "grade": payload["grade"],
        "gender": payload["gender"],
        "date_of_birth": payload["date_of_birth"]
    }).eq("id", student_id).execute()

    return {
        "success": True,
        "message": "Student updated successfully",
        "data": response.data
    }



@app.put("/update-subject/{subject_id}")
def update_subject(subject_id: int, updated_data: dict):
    response = supabase.table("subjects").update(updated_data).eq("id", subject_id).execute()
    return {"success": True, "message": f"Subject with ID {subject_id} updated!", "data": response.data}

# ------------------ DELETE ------------------
@app.delete("/delete-teacher/{teacher_id}")
def delete_teacher(teacher_id: int):
    response = supabase.table("users").delete().eq("id", teacher_id).execute()
    return {"success": True, "message": f"Teacher with ID {teacher_id} deleted.", "data": response.data}

@app.delete("/delete-student/{student_id}")
def delete_student(student_id: int):
    response = supabase.table("students").delete().eq("id", student_id).execute()
    return {"success": True, "message": f"Student with ID {student_id} deleted.", "data": response.data}

@app.delete("/delete-subject/{subject_id}")
def delete_subject(subject_id: int):
    response = supabase.table("subjects").delete().eq("id", subject_id).execute()
    return {"success": True, "message": f"Subject with ID {subject_id} deleted.", "data": response.data}
# ===============================
# GET STUDENT PERFORMANCE (REAL DATA)
# ===============================
@app.get("/students/{student_id}/performance")
def get_student_performance(student_id: int):
    try:
        # 1️⃣ Fetch all results for this student
        results_query = supabase.table("results").select("*").eq("student_id", student_id).execute()
        results = results_query.data

        if not results:
            return {"success": True, "performance": [], "message": "No performance records found yet."}

        # 2️⃣ Get subject names for mapping
        subjects_query = supabase.table("subjects").select("id, name").execute()
        subjects = {s["id"]: s["name"] for s in subjects_query.data}

        # 3️⃣ Combine subject names with marks
        performance = []
        for r in results:
            subject_name = subjects.get(r["subject_id"], "Unknown Subject")
            performance.append({
                "subject": subject_name,
                "marks": r["marks"],
                "term": r["term"],
                "exam_type": r["exam_type"]
            })

        return {"success": True, "performance": performance}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ===============================
# ADMIN: RELEASE / UNRELEASE RESULTS
# ===============================
@app.post("/admin/release-results")
def release_results(term: str, released: bool, admin_id: int | None = None):
    """
    Example body:
    {
      "term": "2025-T1",
      "released": true,
      "admin_id": 1
    }
    """
    try:
        # Check if term exists already
        existing = supabase.table("result_release").select("*").eq("term", term).execute()

        if existing.data:
            # Update existing release record
            result = supabase.table("result_release").update({
                "released": released,
                "released_at": datetime.datetime.now().isoformat(),
                "updated_by": admin_id
            }).eq("term", term).execute()
        else:
            # Insert a new release record
            result = supabase.table("result_release").insert({
                "term": term,
                "released": released,
                "released_at": datetime.datetime.now().isoformat(),
                "updated_by": admin_id
            }).execute()

        status = "released" if released else "withheld"
        return {"success": True, "message": f"Results for {term} have been {status}.", "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/students/{student_id}/performance")
def get_student_performance(student_id: int):
    try:
        # 1️⃣ Fetch all results for this student
        results_query = supabase.table("results").select("*").eq("student_id", student_id).execute()
        results = results_query.data

        if not results:
            return {"success": True, "performance": [], "message": "No performance records found yet."}

        # 2️⃣ Fetch release info for terms
        release_query = supabase.table("result_release").select("*").execute()
        release_status = {r["term"]: r["released"] for r in release_query.data}

        # 3️⃣ Get subject names
        subjects_query = supabase.table("subjects").select("id, name").execute()
        subjects = {s["id"]: s["name"] for s in subjects_query.data}

        # 4️⃣ Include only released term results
        performance = []
        for r in results:
            term_released = release_status.get(r["term"], False)
            if not term_released:
                continue  # skip if not released

            subject_name = subjects.get(r["subject_id"], "Unknown Subject")
            performance.append({
                "subject": subject_name,
                "marks": r["marks"],
                "term": r["term"],
                "exam_type": r["exam_type"]
            })

        if not performance:
            return {"success": True, "performance": [], "message": "Results not yet released."}

        return {"success": True, "performance": performance}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# DELETE PARENT
@app.delete("/delete-parent/{parent_id}")
async def delete_parent(parent_id: int):
    try:
        # Assuming you are using Supabase or a similar DB connector
        res = supabase.table("parents").delete().eq("id", parent_id).execute()
        if len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Parent not found")
        return {"message": "Parent deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ===============================
# TEACHER: BULK ADD RESULTS
# ===============================
@app.post("/add-results-bulk")
def add_results_bulk(data: dict = Body(...)):
    """
    Expected JSON:
    {
      "term": "2025-T1",
      "exam_type": "Midterm",
      "teacher_id": 4,
      "subject_id": 2,
      "results": [
        {"student_id": 1, "marks": 85},
        {"student_id": 2, "marks": 72}
      ]
    }
    """
    try:
        required = ["term", "exam_type", "teacher_id", "subject_id", "results"]
        if not all(k in data for k in required):
            raise HTTPException(status_code=400, detail="Missing required fields.")

        term = data["term"]
        exam_type = data["exam_type"]
        teacher_id = data["teacher_id"]
        subject_id = data["subject_id"]
        results_list = data["results"]

        if not isinstance(results_list, list) or not results_list:
            raise HTTPException(status_code=400, detail="Results list must contain at least one entry.")

        inserts = []
        for entry in results_list:
            if "student_id" not in entry or "marks" not in entry:
                continue
            inserts.append({
                "student_id": entry["student_id"],
                "subject_id": subject_id,
                "teacher_id": teacher_id,
                "term": term,
                "exam_type": exam_type,
                "marks": entry["marks"]
            })

        # Insert all at once
        result = supabase.table("results").insert(inserts).execute()

        return {
            "success": True,
            "message": f"{len(inserts)} results added for subject {subject_id} ({term}).",
            "data": result.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ===============================
# ADMIN: VIEW ALL RESULTS (RAW DATA)
# ===============================
@app.get("/admin/view-results")
def admin_view_results(term: str | None = None):
    """
    Returns all recorded marks (optionally filtered by term).
    """
    try:
        query = supabase.table("results").select("*")
        if term:
            query = query.eq("term", term)
        results_query = query.execute()
        results = results_query.data

        if not results:
            return {"success": True, "results": [], "message": "No results found."}

        # Fetch supporting data
        students = {s["id"]: s for s in supabase.table("students").select("id, name, reg_no, grade").execute().data}
        subjects = {s["id"]: s["name"] for s in supabase.table("subjects").select("id, name").execute().data}
        teachers = {t["id"]: t["name"] for t in supabase.table("users").select("id, name").eq("role", "teacher").execute().data}

        # Combine all info neatly
        formatted = []
        for r in results:
            formatted.append({
                "student_name": students.get(r["student_id"], {}).get("name", "Unknown"),
                "student_reg": students.get(r["student_id"], {}).get("reg_no", "N/A"),
                "grade": students.get(r["student_id"], {}).get("grade", "N/A"),
                "subject": subjects.get(r["subject_id"], "Unknown"),
                "teacher": teachers.get(r["teacher_id"], "Unknown"),
                "marks": r["marks"],
                "term": r["term"],
                "exam_type": r["exam_type"],
            })

        return {"success": True, "results": formatted}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ===============================
# ADMIN: RESULTS CONTROL PANEL
# ===============================
@app.get("/admin/results-summary")
def results_summary(term: str):
    """
    Returns upload stats for Grades 1–9 (always shown), with dynamic counts.
    """
    try:
        # All possible grade names (adjust as needed)
        grade_list = [f"Grade {i}" for i in range(1, 10)]

        # Get all subjects
        subjects = supabase.table("subjects").select("id").execute().data
        total_subjects = len(subjects)

        # Get all students (for grade grouping)
        students = supabase.table("students").select("id, grade").execute().data
        grade_students = {g: [s["id"] for s in students if s["grade"] == g] for g in grade_list}

        # Get all results for that term
        results = supabase.table("results").select("student_id, subject_id").eq("term", term).execute().data

        # Build per-grade metrics
        summary = []
        for grade in grade_list:
            student_ids = grade_students.get(grade, [])
            uploaded_subjects = set()
            for r in results:
                if r["student_id"] in student_ids:
                    uploaded_subjects.add(r["subject_id"])
            uploaded = len(uploaded_subjects)
            pending = max(0, total_subjects - uploaded)
            status = "✅ Complete" if uploaded == total_subjects and total_subjects > 0 else "⏳ In Progress"

            summary.append({
                "class": grade,
                "total_subjects": total_subjects,
                "uploaded": uploaded,
                "pending": pending,
                "status": status
            })

        return {"success": True, "summary": summary}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/class-results/{grade}")
def get_class_results(grade: str):
    try:
        # Fetch all results joined with student info
        results = (
            supabase.table("results")
            .select("subject_id, teacher_id, marks, student_id")
            .execute()
        )

        if not results.data:
            return {"success": True, "class": grade, "subjects": []}

        # Load mapping data
        students = {
            s["id"]: s
            for s in supabase.table("students")
            .select("id, grade")
            .execute()
            .data
        }
        subjects = {
            s["id"]: s["name"]
            for s in supabase.table("subjects").select("id, name").execute().data
        }
        teachers = {
            t["id"]: t["name"]
            for t in supabase.table("users")
            .select("id, name")
            .eq("role", "teacher")
            .execute()
            .data
        }

        # Group results per subject for this grade
        from collections import defaultdict
        subject_summary = defaultdict(lambda: {"uploaded": 0, "total_marks": 0, "count": 0, "teacher": None})

        for r in results.data:
            student = students.get(r["student_id"])
            if not student or student["grade"] != grade:
                continue

            subj = subjects.get(r["subject_id"], "Unknown")
            teacher = teachers.get(r["teacher_id"], "Unknown")

            subject_summary[subj]["uploaded"] += 1
            subject_summary[subj]["total_marks"] += r.get("marks", 0)
            subject_summary[subj]["count"] += 1
            subject_summary[subj]["teacher"] = teacher

        # Format output
        summary = []
        for subject, info in subject_summary.items():
            avg = round(info["total_marks"] / info["count"], 1) if info["count"] else None
            summary.append({
                "subject": subject,
                "teacher": info["teacher"],
                "uploaded": info["uploaded"],
                "pending": 0,
                "average_marks": avg
            })

        return {"success": True, "class": grade, "subjects": summary}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


