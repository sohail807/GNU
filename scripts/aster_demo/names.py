"""Synthetic name pools by nationality for the Gulf demo. All combinations are fictitious.

person(rng, nationality, gender) -> "First Last". The pools are deliberately small and common, so any real
person who happens to share a name is a coincidence, and every generated patient also gets a SYN marker in the
loaders so nothing here can be mistaken for a real record.
"""

POOLS = {
    "indian": (
        ["Arjun", "Rohan", "Vikram", "Suresh", "Anil", "Manoj", "Rajesh", "Karthik", "Naveen", "Pradeep", "Sanjay", "Joseph", "Thomas", "George", "Harish", "Mahesh", "Ravi", "Deepak", "Varun", "Nikhil"],
        ["Priya", "Anitha", "Deepa", "Lakshmi", "Meera", "Neha", "Divya", "Sneha", "Maya", "Kavya", "Rekha", "Sandhya", "Anju", "Revathi", "Nisha", "Shalini", "Geetha", "Pooja", "Smitha", "Asha"],
        ["Nair", "Menon", "Pillai", "Iyer", "Reddy", "Rao", "Kumar", "Sharma", "Varghese", "Mathew", "Krishnan", "Naidu", "Shetty", "Patil", "Kulkarni", "Raman", "Das", "Bose", "Verma", "Gupta"],
    ),
    "arab_levant_egypt": (
        ["Omar", "Khaled", "Hassan", "Mahmoud", "Youssef", "Tarek", "Ahmed", "Mohamed", "Samir", "Karim", "Walid", "Fadi", "Nabil", "Ziad", "Ibrahim"],
        ["Layla", "Nour", "Fatima", "Mariam", "Hala", "Dina", "Rana", "Salma", "Amira", "Yasmin", "Reem", "Lina", "Huda", "Samar", "Rasha"],
        ["Haddad", "Khalil", "Mansour", "Saleh", "Nasser", "Farouk", "Abdallah", "Hamdan", "Zahran", "Issa", "Aziz", "Kassem", "Sabbagh", "Darwish", "Ghanem"],
    ),
    "pakistani": (
        ["Imran", "Faisal", "Bilal", "Usman", "Hamza", "Asif", "Tariq", "Nadeem", "Shahid", "Kamran", "Zubair", "Adnan"],
        ["Ayesha", "Sana", "Hina", "Zainab", "Maria", "Sadia", "Nadia", "Farah", "Rabia", "Mehwish", "Iqra", "Saima"],
        ["Khan", "Malik", "Ahmed", "Hussain", "Qureshi", "Siddiqui", "Sheikh", "Butt", "Chaudhry", "Raza", "Ansari", "Mirza"],
    ),
    "emirati": (
        ["Khalifa", "Saeed", "Rashid", "Sultan", "Hamad", "Mansoor", "Majid", "Salem", "Obaid", "Abdulla"],
        ["Mariam", "Latifa", "Shamsa", "Maitha", "Noura", "Aisha", "Hessa", "Moza", "Fatima", "Alia"],
        ["Al Mazrouei", "Al Falasi", "Al Suwaidi", "Al Shamsi", "Al Ketbi", "Al Nuaimi", "Al Marri", "Al Dhaheri", "Al Hashimi", "Al Mansoori"],
    ),
    "qatari": (
        ["Hamad", "Jassim", "Abdulaziz", "Khalid", "Nasser", "Faisal", "Mohammed", "Saud", "Talal", "Rashid"],
        ["Moza", "Noor", "Aisha", "Maryam", "Hessa", "Sheikha", "Amna", "Dana", "Latifa", "Reem"],
        ["Al Thani", "Al Kuwari", "Al Naimi", "Al Marri", "Al Sulaiti", "Al Mohannadi", "Al Emadi", "Al Jaber", "Al Hajri", "Al Mannai"],
    ),
    "filipino": (
        ["Jose", "Juan", "Mark", "John", "Paolo", "Miguel", "Carlo", "Rafael", "Angelo", "Ramon"],
        ["Maria", "Angela", "Jasmine", "Cristina", "Grace", "Michelle", "Joy", "Katrina", "Liza", "Rowena"],
        ["Santos", "Reyes", "Cruz", "Bautista", "Garcia", "Mendoza", "Torres", "Flores", "Ramos", "Aquino"],
    ),
    "bangladeshi": (
        ["Rahim", "Karim", "Jamal", "Sabbir", "Mizanur", "Rafiq", "Tanvir", "Anwar", "Habib", "Shamim"],
        ["Fatema", "Nasrin", "Shirin", "Rokeya", "Jannat", "Sultana", "Rumana", "Taslima", "Halima", "Parveen"],
        ["Hossain", "Rahman", "Islam", "Uddin", "Chowdhury", "Ahmed", "Mia", "Sarker", "Khatun", "Akter"],
    ),
    "western": (
        ["Alexander", "James", "Daniel", "Thomas", "Oliver", "Lucas", "Mark", "Andrew", "Peter", "Stefan"],
        ["Emma", "Sophie", "Olivia", "Hannah", "Laura", "Anna", "Julia", "Claire", "Nicole", "Katherine"],
        ["Wright", "Miller", "Taylor", "Brown", "Schmidt", "Martin", "Novak", "Fischer", "Walker", "Evans"],
    ),
    "srilankan": (
        ["Nuwan", "Chaminda", "Sampath", "Lasith", "Kasun", "Dilshan", "Ruwan", "Pradeep"],
        ["Nirmala", "Chamari", "Dilani", "Sanduni", "Thilini", "Madhavi", "Kumari", "Anoma"],
        ["Perera", "Fernando", "Silva", "Jayawardena", "Wickramasinghe", "Gunawardena", "Bandara", "Rajapaksha"],
    ),
    "nepali": (
        ["Ramesh", "Sunil", "Bishnu", "Krishna", "Prakash", "Dipak", "Santosh", "Binod"],
        ["Sita", "Gita", "Sabina", "Anita", "Sunita", "Kamala", "Laxmi", "Radha"],
        ["Sharma", "Thapa", "Gurung", "Rai", "Tamang", "Shrestha", "Adhikari", "Karki"],
    ),
    "african": (
        ["Samuel", "Daniel", "Emmanuel", "Joseph", "Peter", "Michael", "Isaac", "Kwame"],
        ["Grace", "Faith", "Esther", "Mercy", "Ruth", "Blessing", "Amina", "Zainab"],
        ["Mensah", "Okafor", "Kamau", "Mwangi", "Abdi", "Tesfaye", "Diallo", "Banda"],
    ),
}


def person(rng, nationality, gender):
    """gender: 'Male' or 'Female'."""
    male, female, surnames = POOLS[nationality]
    return f"{rng.choice(male if gender == 'Male' else female)} {rng.choice(surnames)}"
