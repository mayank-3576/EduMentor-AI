from flask import Flask, render_template, request, redirect, session
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector

app = Flask(__name__)

app.secret_key = "edumentor-secret-key"


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="123456",
        database="edumentor"
    )


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():
    return redirect("/login")


# ==========================================
# REGISTER
# ==========================================

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        name = request.form["name"]
        email = request.form["email"]
        password = request.form["password"]

        # Hash password before storing
        hashed_password = generate_password_hash(password)

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (%s, %s, %s)
            """,
            (name, email, hashed_password)
        )

        db.commit()

        cursor.close()
        db.close()

        return redirect("/login")

    return render_template("register.html")


# ==========================================
# LOGIN
# ==========================================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form["email"]
        password = request.form["password"]

        db = get_db()

        cursor = db.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM users WHERE email = %s",
            (email,)
        )

        user = cursor.fetchone()

        cursor.close()
        db.close()

        # Check user and password
        if user and check_password_hash(
            user["password"],
            password
        ):

            session["user_id"] = user["id"]
            session["name"] = user["name"]

            return redirect("/dashboard")

        return "Invalid email or password"

    return render_template("login.html")


# ==========================================
# DASHBOARD
# ==========================================

@app.route("/dashboard")
def dashboard():

    if "user_id" not in session:
        return redirect("/login")

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # -----------------------------------------
    # 1. Get overall performance
    # -----------------------------------------

    cursor.execute(
        """
        SELECT
            SUM(score) AS total_score,
            SUM(total_questions) AS total_questions
        FROM quiz_attempts
        WHERE user_id = %s
        """,
        (session["user_id"],)
    )

    overall = cursor.fetchone()

    overall_performance = 0

    if overall and overall["total_questions"]:
        overall_performance = round(
            (overall["total_score"] / overall["total_questions"]) * 100
        )


    # -----------------------------------------
    # 2. Get most recent quiz
    # -----------------------------------------

    cursor.execute(
        """
        SELECT
            score,
            total_questions
        FROM quiz_attempts
        WHERE user_id = %s
        ORDER BY attempt_date DESC
        LIMIT 1
        """,
        (session["user_id"],)
    )

    recent = cursor.fetchone()

    recent_quiz = 0

    if recent and recent["total_questions"]:
        recent_quiz = round(
            (recent["score"] / recent["total_questions"]) * 100
        )


    # -----------------------------------------
    # 3. Find weakest topic
    # -----------------------------------------

    cursor.execute(
        """
        SELECT
            t.topic_name,
            AVG(
                (qa.score / qa.total_questions) * 100
            ) AS performance
        FROM quiz_attempts qa
        JOIN topics t
            ON qa.topic_id = t.id
        WHERE qa.user_id = %s
        GROUP BY t.id, t.topic_name
        ORDER BY performance ASC
        LIMIT 1
        """,
        (session["user_id"],)
    )

    weak = cursor.fetchone()

    weak_topic = "No data yet"

    if weak:
        weak_topic = weak["topic_name"]


    cursor.close()
    db.close()


    # -----------------------------------------
    # 4. Send data to dashboard
    # -----------------------------------------

    return render_template(
        "dashboard.html",
        name=session["name"],
        overall_performance=overall_performance,
        recent_quiz=recent_quiz,
        weak_topic=weak_topic
    )


# ==========================================
# QUIZ
# ==========================================

@app.route("/quiz", methods=["GET", "POST"])
def quiz():

    # User must be logged in
    if "user_id" not in session:
        return redirect("/login")

    # When quiz is submitted
    if request.method == "POST":

        # Correct answers
        answers = {
            "q1": "A",
            "q2": "B",
            "q3": "B",
            "q4": "B",
            "q5": "C"
        }

        # Initial score
        score = 0

        # Check every answer
        for question, correct_answer in answers.items():

            user_answer = request.form.get(question)

            if user_answer == correct_answer:
                score += 1

        # Calculate percentage
        percentage = (score / 5) * 100


        # ==========================================
        # SAVE QUIZ RESULT IN DATABASE
        # ==========================================

        db = get_db()

        cursor = db.cursor()

        cursor.execute(
    """
    INSERT INTO quiz_attempts
    (user_id, topic_id, score, total_questions)
    VALUES (%s, %s, %s, %s)
    """,
    (session["user_id"], 1, score, 5)
)

        db.commit()

        cursor.close()
        db.close()


        # ==========================================
        # SHOW RESULT
        # ==========================================

        return f"""
        <!DOCTYPE html>

        <html>

        <head>

            <title>Quiz Result - EduMentor AI</title>

            <style>

                body {{
                    font-family: Arial, sans-serif;
                    background: #f4f7fb;
                    text-align: center;
                    padding-top: 100px;
                }}

                .result-card {{
                    background: white;
                    width: 500px;
                    margin: auto;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                }}

                h1 {{
                    color: #2563eb;
                }}

                h2 {{
                    margin: 15px;
                }}

                a {{
                    display: inline-block;
                    margin-top: 20px;
                    padding: 12px 25px;
                    background: #2563eb;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                }}

                a:hover {{
                    background: #1d4ed8;
                }}

            </style>

        </head>


        <body>

            <div class="result-card">

                <h1>Quiz Completed 🎉</h1>

                <h2>Your Score: {score}/5</h2>

                <h2>Percentage: {percentage}%</h2>

                <a href="/dashboard">
                    Back to Dashboard
                </a>

            </div>

        </body>

        </html>
        """


    # Show quiz page
    return render_template("quiz.html")


# ==========================================
# LOGOUT
# ==========================================

@app.route("/logout")
def logout():

    session.clear()

    return redirect("/login")


# ==========================================
# RUN APPLICATION
# ==========================================

if __name__ == "__main__":

    app.run(debug=True)