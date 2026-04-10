// ===== DONNÉES MOCK =====

let defaultStudents = [
{
id: 1,
nom: "Rakoto",
prenom: "Jean",
dateNais: "2000-05-10",
email: "jean@mail.com",
tel: "+261123456",
adresse: "Antananarivo",
niveau: "B1",
passport: "P12345",
cin: "101234567"
}
];

let students = [];
if (localStorage.getItem("studentsData")) {
    students = JSON.parse(localStorage.getItem("studentsData"));
} else {
    students = defaultStudents;
    localStorage.setItem("studentsData", JSON.stringify(students));
}

let editIndex = null;


// ===== AFFICHAGE =====

function displayStudents(dataToDisplay = students) {

const table = document.getElementById("studentTable");
if (!table) return;

table.innerHTML = "";

const countEl = document.getElementById("studentCount");
if (countEl) countEl.innerText = dataToDisplay.length;

dataToDisplay.forEach((s) => {
    // Retrouver l'index original dans le tableau global students
    const originalIndex = students.indexOf(s);

table.innerHTML += `
<tr class="border-b border-[#e2e8f0] hover:bg-[#f8fafc] bg-white transition-colors">
<td class="p-[14px] text-gray-700 font-medium">${s.nom}</td>
<td class="p-[14px] text-gray-700">${s.prenom}</td>
<td class="p-[14px] text-gray-700">${s.dateNais}</td>
<td class="p-[14px] text-gray-700">${s.cin || '–'}</td>
<td class="p-[14px] text-gray-700">${s.email}</td>
<td class="p-[14px] text-gray-700">${s.tel}</td>
<td class="p-[14px] text-gray-700">${s.adresse}</td>
<td class="p-[14px] text-gray-700">${s.niveau}</td>
<td class="p-[14px] text-center text-gray-700">${s.a1 ? 'Oui' : 'Non'}</td>
<td class="p-[14px] text-center text-gray-700">${s.a2 ? 'Oui' : 'Non'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.c1 || '–'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.c2 || '–'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.b1 || '–'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.b2 || '–'}</td>
<td class="p-[14px] text-center text-gray-700">${s.paramede ? 'Oui' : 'Non'}</td>
<td class="p-[14px] text-gray-700">${s.passport || '–'}</td>
<td class="p-[14px] text-gray-700">${s.datFinPass || '–'}</td>
<td class="p-[14px] text-gray-700">${s.numCop || '–'}</td>
<td class="p-[14px] text-gray-700">${s.datFinCop || '–'}</td>

<td class="p-[14px]">
<div class="flex items-center gap-3">
  <button
  onclick="editStudent(${originalIndex})"
  class="flex items-center justify-center gap-1.5 px-[12px] py-[6px] rounded-[8px] bg-white border border-[#3b82f6] text-[#3b82f6] hover:bg-blue-50 transition-colors font-medium text-sm">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
    Modifier
  </button>
  <button
  onclick="deleteStudent(${originalIndex})"
  class="flex items-center justify-center gap-1.5 px-[12px] py-[6px] rounded-[8px] bg-white border border-[#ef4444] text-[#ef4444] hover:bg-red-50 transition-colors font-medium text-sm">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
    Supprimer
  </button>
</div>
</td>
</tr>
`;

});

}



// ===== NETTOYER =====

function clearForm() {

document.getElementById("nom").value = "";
document.getElementById("prenom").value = "";
document.getElementById("dateNais").value = "";
document.getElementById("email").value = "";
document.getElementById("tel").value = "";
document.getElementById("adresse").value = "";
document.getElementById("niveau").value = "A1";
document.getElementById("passport").value = "";
document.getElementById("cin").value = "";

editIndex = null;

}



// ===== SAUVEGARDE =====

function saveStudent() {
let student = {
id: editIndex === null ? Date.now() : students[editIndex].id,
nom: document.getElementById("nom").value,
prenom: document.getElementById("prenom").value,
dateNais: document.getElementById("dateNais").value,
email: document.getElementById("email").value,
tel: document.getElementById("tel").value,
adresse: document.getElementById("adresse").value,
niveau: document.getElementById("niveau").value,
passport: document.getElementById("passport").value,
cin: document.getElementById("cin").value
};

if (editIndex === null) {
students.push(student);
} else {
students[editIndex] = student;
}
localStorage.setItem("studentsData", JSON.stringify(students));
closeForm();
displayStudents();
}

let isSubmitting = false;

function sendData(event) {
if (event) event.preventDefault();
if (isSubmitting) return;
isSubmitting = true;

let indexStr = localStorage.getItem("editIndex");
let editIndexParam = indexStr !== null ? parseInt(indexStr) : null;

// Helper to get value from either HTML IDs
const getVal = (ids) => {
    for (let id of ids) {
        let el = document.getElementById(id);
        if (el) return el.value;
    }
    return "";
};

// ===== CERTIFICATS =====
const checked = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };
const certStr = (ids) => ids.map(id => checked(id) ? id.slice(-1) : '').join('');

let student = {
    id: editIndexParam !== null ? students[editIndexParam].id : Date.now(),
    nom: getVal(["idNom", "nom"]),
    prenom: getVal(["idPrenom", "prenom"]),
    dateNais: getVal(["idDateNais", "dateNais"]),
    email: getVal(["idEmail", "email"]),
    tel: getVal(["idTel", "tel"]),
    adresse: getVal(["idAdresse", "adresse"]),
    niveau: getVal(["idNiveau", "niveau"]),
    a1: checked("A1"),
    a2: checked("A2"),
    c1: certStr(["C1L", "C1H", "C1M", "C1S"]),
    c2: certStr(["C2L", "C2H", "C2M", "C2S"]),
    b1: certStr(["B1L", "B1H", "B1M", "B1S"]),
    b2: certStr(["B2L", "B2H", "B2M", "B2S"]),
    paramede: checked("idParamede"),
    passport: getVal(["idNumPass", "passport"]),
    datFinPass: getVal(["idDatFinPass", "datFinPass"]),
    numCop: getVal(["idNumCop", "numCop"]),
    datFinCop: getVal(["idDatFinCop", "datFinCop"]),
    matricule: getVal(["idMatricule", "matricule"]),
    cin: getVal(["idNumCin", "cin"])
};

if (editIndexParam !== null) {
    students[editIndexParam] = student;
} else {
    students.push(student);
}
localStorage.setItem("studentsData", JSON.stringify(students));

localStorage.removeItem("studentToEdit");
localStorage.removeItem("editIndex");
window.location.href = "list.html";
}


// ===== FILTRAGE =====

function filterStudents() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const a1Only = document.getElementById("filterA1").checked;
    const a2Only = document.getElementById("filterA2").checked;
    
    // Récupérer les modules cochés pour chaque certificat (Vertical Checkboxes)
    const getCheckedModules = (className) => {
        const checked = document.querySelectorAll(`.${className}:checked`);
        return Array.from(checked).map(cb => cb.value);
    };

    const b1Modules = getCheckedModules("filterB1");
    const b2Modules = getCheckedModules("filterB2");
    const c1Modules = getCheckedModules("filterC1");
    const c2Modules = getCheckedModules("filterC2");

    const filtered = students.filter(s => {
        // Recherche textuelle
        const matchesText = 
            s.nom.toLowerCase().includes(query) || 
            s.prenom.toLowerCase().includes(query) || 
            (s.cin && s.cin.toLowerCase().includes(query));

        if (!matchesText) return false;

        // Filtres Boolean (A1, A2)
        if (a1Only && !s.a1) return false;
        if (a2Only && !s.a2) return false;

        // Filtres Certificats (OU logic : l'étudiant match s'il a AU MOINS UN des modules cochés)
        const checkModulesOr = (studentVal, activeMods) => {
            if (activeMods.length === 0) return true;
            const sVal = studentVal || "";
            // Retourne true si au moins un des modules cochés est inclus dans la valeur de l'étudiant
            return activeMods.some(mod => sVal.includes(mod));
        };

        if (!checkModulesOr(s.b1, b1Modules)) return false;
        if (!checkModulesOr(s.b2, b2Modules)) return false;
        if (!checkModulesOr(s.c1, c1Modules)) return false;
        if (!checkModulesOr(s.c2, c2Modules)) return false;

        return true;
    });
    displayStudents(filtered);
}


// ===== MODIFIER =====

function editStudent(index){
let student = students[index];
localStorage.setItem("studentToEdit", JSON.stringify(student));
localStorage.setItem("editIndex", index);
window.location.href = "index.html";
}


// ===== ANNULER / RESET =====

function resetForm() {
    // Remet le texte du bouton à "Soumettre"
    const btn = document.getElementById("submitBtn");
    if (btn) btn.textContent = "Soumettre";

    // Nettoie le localStorage pour quitter le mode édition
    localStorage.removeItem("studentToEdit");
    localStorage.removeItem("editIndex");

    // Réinitialise le verrou de soumission
    isSubmitting = false;
}


// ===== SUPPRIMER =====

function deleteStudent(index) {
if (confirm("Supprimer cet étudiant ?")) {
students.splice(index, 1);
localStorage.setItem("studentsData", JSON.stringify(students));
displayStudents();
}
}



// ===== INITIAL =====

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            sendData();
        });
    }

    const table = document.getElementById("studentTable");
    if (table) {
        displayStudents();
    }

    const studentStr = localStorage.getItem("studentToEdit");
    if (studentStr) {
        let student = JSON.parse(studentStr);
        let indexStr = localStorage.getItem("editIndex");
        if (indexStr !== null) {
            editIndex = parseInt(indexStr);
        }

        // Remplit les champs du formulaire (utilise les id de index.html ou script.js)
        let fields = {
            nom: ["nom", "idNom"],
            prenom: ["prenom", "idPrenom"],
            dateNais: ["dateNais", "idDateNais"],
            email: ["email", "idEmail"],
            tel: ["tel", "idTel"],
            adresse: ["adresse", "idAdresse"],
            niveau: ["niveau", "idNiveau"],
            passport: ["passport", "idNumPass"],
            datFinPass: ["datFinPass", "idDatFinPass"],
            numCop: ["numCop", "idNumCop"],
            datFinCop: ["datFinCop", "idDatFinCop"],
            matricule: ["matricule", "idMatricule"],
            cin: ["cin", "idNumCin"]
        };

        for (let key in fields) {
            let el = document.getElementById(fields[key][0]) || document.getElementById(fields[key][1]);
            if (el) {
                el.value = student[key];
            }
        }

        // Rempli les checkboxes des certificats
        const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
        setCheck("A1", !!student.a1);
        setCheck("A2", !!student.a2);
        ["C1L","C1H","C1M","C1S"].forEach(id => setCheck(id, (student.c1 || "").includes(id.slice(-1))));
        ["C2L","C2H","C2M","C2S"].forEach(id => setCheck(id, (student.c2 || "").includes(id.slice(-1))));
        ["B1L","B1H","B1M","B1S"].forEach(id => setCheck(id, (student.b1 || "").includes(id.slice(-1))));
        ["B2L","B2H","B2M","B2S"].forEach(id => setCheck(id, (student.b2 || "").includes(id.slice(-1))));
        setCheck("idParamede", !!student.paramede);

        // Change le texte du bouton Soumettre en Modifier
        let buttons = document.querySelectorAll("button");
        buttons.forEach(btn => {
            if (btn.textContent.trim().toLowerCase() === "soumettre") {
                btn.textContent = "Modifier";
            }
        });
    }
});