//======================session============================

if (!window.fetch) {
  alert("Ton navigateur est trop ancien");
}

// session

let nowtoken = sessionStorage.getItem("token");
const expireTime = parseInt(sessionStorage.getItem("expireTime") || "0");

let now = new Date().getTime();

if (!nowtoken || !expireTime || now > expireTime) {
    sessionStorage.clear();
    window.location.href = "login.html";
}

// refresh session sur activité
["click", "mousemove", "keydown"].forEach(event => {
    document.addEventListener(event, () => {
        const newExpireTime = Date.now() + 30 * 60 * 1000;
        sessionStorage.setItem("expireTime", String(newExpireTime));
    });
});
// Ajouter un écouteur d'événement pour réinitialiser le temps d'expiration à chaque mouvement de souris
function logout() {
    sessionStorage.clear();
    window.location.href = "login.html";
}
// Fin du script session


function dateToISO(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

function isoToDate(dateStr) {
    if (!dateStr) return "";
    if (typeof dateStr === "string" && dateStr.includes("T")) {
        return dateStr.split("T")[0];
    }
    return dateStr;
}

// Fonction utilitaire pour vérifier la véracité (gère booleans et strings "true"/"false")
function isTrue(val) {
    if (val === true) return true;
    if (typeof val === "string") {
        const lower = val.toLowerCase();
        return lower === "true" || lower === "oui" || lower === "1";
    }
    return false;
}

function calculateAge(dateStr) {
    if (!dateStr) return "–";

    let birthDate = new Date(dateStr);
    let today = new Date();

    if (isNaN(birthDate.getTime())) return "–";

    let age = today.getFullYear() - birthDate.getFullYear();
    let monthDiff = today.getMonth() - birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    return age;
}

function btnAjout() {
    let students = JSON.parse(localStorage.getItem("studentsData"));
    if (localStorage.getItem("Mtrcl")) {
        localStorage.removeItem("Mtrcl");
        console.log("Mtrcl removed");
    }
    localStorage.removeItem("studentToEdit");
    localStorage.removeItem("editIndex");
    localStorage.setItem("Mtrcl", parseInt(students[students.length - 1].matricule) + 1);
    location.href = "index.html";
}

const ETUDIENT_WEBHOOK ="https://hook.us2.make.com/ybg7uxfelww1snww4uzmndq95dg7fkkl";
async function fetchStudents() {
    const rawData = [];
    if ( localStorage.getItem("studentsData")){
    const res = await fetch(ETUDIENT_WEBHOOK, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "fetch_students"
        })
    });
    if (!res.ok) {
        throw new Error("Network error");
    }


    // Récupération de la réponse
    rawData = await res.json();
}else{
    rawData = JSON.parse(localStorage.getItem("studentsData"));
}
    const data = rawData.map(item => {
        // Version robuste pour ignorer les problèmes de majuscule/minuscule ou d'espaces
        const lowerItem = {};
        for (let k in item) {
            if (item.hasOwnProperty(k)) {
                lowerItem[k.trim().toLowerCase()] = item[k];
            }
        }

        return {
            matricule: item.numero || lowerItem.numero,
            nom: item.nom || lowerItem.nom,
            prenom: item.prenom || lowerItem.prenom,
            dateNaissance: item.dateNaissance || lowerItem.datenaissance,
            dateEntree: item.dateEntree || lowerItem.dateentree,
            email: item.email || lowerItem.email,
            telephone: item.telephone || lowerItem.telephone,
            facebook: item.facebook || lowerItem.facebook,
            niveau: item.niveau || lowerItem.niveau,
            paiement: item.paiement || lowerItem.paiement,
            totalAPayer: item.totalAPayer || item[" totalAPayer"] || lowerItem.totalapayer || 0,
            montantPaye: item["montantPayé"] || item.montantPayé || lowerItem["montantpayé"] || lowerItem.montantpaye || 0,
            a1: item.A1 || lowerItem.a1,
            a2: item.A2 || lowerItem.a2,
            b1: item.B1 || lowerItem.b1,
            b2: item.B2 || lowerItem.b2,
            c1: item.C1 || lowerItem.c1,
            c2: item.C2 || lowerItem.c2,
            cin: item.numCin || lowerItem.numcin || lowerItem.cin,
            Adresse: item.adresse || lowerItem.adresse,
            passport: item.numpass || lowerItem.numpass || lowerItem.passport,
            datFinPass: item["date expiration pass"] || lowerItem["date expiration pass"],
            numCop: item.numcopie || lowerItem.numcopie,
            datFinCop: item["dateexpiration copie"] || lowerItem["dateexpiration copie"],
            paramede: item.paramede || lowerItem.paramede,
            Matricule: item.Matricule || lowerItem.matricule || item.matricule
        };
    });
    students = data;
    console.log("Données mappées :", data);
    return data;
}

// Déclaration unique de la variable globale
if (typeof students === 'undefined') {
    var students = [];
}
console.log("ok");
async function loadStudents() {
    // Force la réactualisation à chaque chargement pour éviter de lire un localStorage obsolète
    /*try {
<<<<<<< HEAD
=======
        if (localStorage.getItem("studentsData"))
        students = await fetchStudents();
        localStorage.setItem("studentsData", JSON.stringify(students));
    } catch(e) {
        if (localStorage.getItem("studentsData")) {
            students = JSON.parse(localStorage.getItem("studentsData"));
        }
    }*/
     if (localStorage.getItem("studentsData")){
            students = JSON.parse(localStorage.getItem("studentsData"));
     }else{
        students = await fetchStudents();
        localStorage.setItem("studentsData", JSON.stringify(students));
        console.log("Students fetched"); 
    }
}
window.onload = loadStudents;
let editIndex = null;
// Initialisation depuis le cache si présent
try {
    const cached = localStorage.getItem("studentsData");
    if (cached) students = JSON.parse(cached);
} catch(e) { console.error("Cache error", e); }
console.log("Initial students:", students);


// ===== AFFICHAGE =====

function displayStudents(dataToDisplay = students) {

    const table = document.getElementById("studentTable");
    if (!table) return;

    table.innerHTML = "";

    // Garder une trace des étudiants affichés pour l'export
    window.currentDisplayedStudents = dataToDisplay;

    const countEl = document.getElementById("studentCount");
    if (countEl) countEl.innerText = dataToDisplay.length;

    dataToDisplay.forEach((s) => {
        // Retrouver l'index original dans le tableau global students
        const originalIndex = students.indexOf(s);

        // 1. Load local payment data for synchronization
        const facturesData = JSON.parse(localStorage.getItem("facturesData") || "[]");
        // Fix: Use String conversion to avoid type mismatch (e.g., number vs string)
        const facture = facturesData.find(f => String(f.matricule) === String(s.matricule));

        // 2. Base totals from student metadata (totalAPayer is the source of truth for the debt)
        const total = parseFloat(s.totalAPayer || s.montantAPayer) || 0;

        // 3. Computed values from payment history (fallback to student fields if no local facture)
        const montantPaye = facture
            ? (facture.dejaPayer || facture.montantPaye || 0)
            : (parseFloat(s.montantPaye) || 0);

        const reste = total - montantPaye;

        // 4. Status mapping: use backend status if available, fallback to local calculation
        let rawStatus = s.paiement || (facture ? facture.paiement : null);
        let paiementStatus = "Non payé";

        if (rawStatus === "PAYE" || rawStatus === "Payé") {
            paiementStatus = "Payé";
        } else if (rawStatus === "EN COURS" || rawStatus === "En cours") {
            paiementStatus = "En cours";
        } else if (!rawStatus) {
            if (total > 0 && reste <= 0) {
                paiementStatus = "Payé";
            } else if (total > 0 && montantPaye > 0) {
                paiementStatus = "En cours";
            } else if (total === 0) {
                paiementStatus = "Payé";
            }
        } else {
            paiementStatus = rawStatus; // Fallback to raw string if any
        }

        table.innerHTML += `
<tr class="border-b border-[#e2e8f0] hover:bg-[#f8fafc] bg-white transition-colors">
<td class="p-[14px] text-gray-700 font-bold">${s.matricule || '–'}</td>
<td class="p-[14px] text-gray-700 font-bold">${s.Matricule || '–'}</td>
<td class="p-[14px] text-gray-700 font-medium">${s.nom}</td>
<td class="p-[14px] text-gray-700">${s.prenom}</td>
<td class="p-[14px] text-gray-700">${isoToDate(s.dateNaissance) || '–'}</td>
<td class="p-[14px] text-gray-700">${isoToDate(s.dateEntree) || '–'}</td>
<td class="p-[14px] text-gray-700 font-bold">${calculateAge(s.dateNaissance)}</td>
<td class="p-[14px] text-gray-700">${s.cin || '–'}</td>
<td class="p-[14px] text-gray-700">${s.email}</td>
<td class="p-[14px] text-gray-700">${s.facebook || '–'}</td>
<td class="p-[14px] text-gray-700">${s.telephone || '–'}</td>
<td class="p-[14px] text-gray-700">${s.Adresse || '–'}</td>
<td class="p-[14px] text-gray-700">${s.niveau}</td>
<td class="p-[14px] text-gray-700 font-bold">${total.toLocaleString()} Ar</td>
<td class="p-[14px] text-gray-700 font-bold text-green-600">${montantPaye.toLocaleString()} Ar</td>
<td class="p-[14px] text-gray-700 font-bold text-orange-600">${reste.toLocaleString()} Ar</td>
<td class="p-[14px] text-center text-xs font-bold uppercase ${paiementStatus === 'Payé' || paiementStatus === 'PAYE' ? 'bg-green-50 text-green-600' : paiementStatus === 'En cours' || paiementStatus === 'EN COURS' ? 'bg-blue-50/50 text-blue-600' : 'bg-red-50 text-red-600'}">
    ${paiementStatus}
</td>
<td class="p-[14px] text-center text-gray-700">${s.a1}</td>
<td class="p-[14px] text-center text-gray-700">${s.a2}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.c1 || '–'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.c2 || '–'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.b1 || '–'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.b2 || '–'}</td>
<td class="p-[14px] text-center text-gray-700">${(s.Paramede !== undefined ? s.Paramede : s.paramede)}</td>
<td class="p-[14px] text-gray-700">${s.passport || '–'}</td>
<td class="p-[14px] text-gray-700">${isoToDate(s.datFinPass) || '–'}</td>
<td class="p-[14px] text-gray-700">${s.numCop || '–'}</td>
<td class="p-[14px] text-gray-700">${isoToDate(s.datFinCop) || '–'}</td>

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
  <button
  onclick="goToFacture(${originalIndex})"
  class="flex items-center justify-center gap-1.5 px-[12px] py-[6px] rounded-[8px] bg-white border border-[#16a34a] text-[#16a34a] hover:bg-green-50 transition-colors font-medium text-sm">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8l-4.3 4.2c-.3.2-.6.3-1 .3H11"/><path d="M15 9h.01"/><path d="M16 5h.01"/></svg>
    Paiement
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
let Ajout_mofif_webhook = "https://hook.us2.make.com/opeawjxysicr56wqy3ekpfkdll071u4t";
async function ajoutermodifierEtudiant(event) {

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

    let existingStudent = editIndexParam !== null ? students[editIndexParam] : {};

    let student = {
        ...existingStudent,
        id: editIndexParam !== null ? existingStudent.id : Date.now(),
        nom: getVal(["idNom", "nom"]),
        prenom: getVal(["idPrenom", "prenom"]),
        dateNaissance: getVal(["idDateNais"]),
        email: getVal(["idEmail", "email"]),
        telephone: getVal(["idTel"]),
        Adresse: getVal(["idAdresse"]),
        niveau: getVal(["idNiveau", "niveau"]),
        montantAPayer: getVal(["idMontant", "montantAPayer"]),
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
        Matricule: getVal(["idMatriculeString", "matriculeString"]),
        cin: getVal(["idNumCin", "cin"]),
        facebook: getVal(["idfcbk", "facebook"])
    };

    let code = "";
    if (editIndexParam !== null) {
        students[editIndexParam] = student;
        code = "mdf";
    } else {
        students.push(student);
        code = "ajt";
    }
    // ajout et modification

    try {
        const dataToSend = {
            numero: student.matricule,
            nom: student.nom,
            prenom: student.prenom,
            dateNaissance: dateToISO(student.dateNaissance),
            email: student.email,
            telephone: student.telephone,
            facebook: student.facebook,
            niveau: student.niveau,
            paiement: student.paiement || "EN COURS",
            totalAPayer: student.montantAPayer || student.totalAPayer || 0,
            "montantPayé": student.montantPaye || 0,
            A1: student.a1,
            A2: student.a2,
            B1: student.b1,
            B2: student.b2,
            C1: student.c1,
            C2: student.c2,
            numCin: student.cin,
            adresse: student.Adresse,
            numpass: student.passport,
            "date expiration pass": dateToISO(student.datFinPass),
            numcopie: student.numCop,
            "dateexpiration copie": dateToISO(student.datFinCop),
            paramede: student.paramede,
            Matricule: student.Matricule,
            Code: code
        };

        if (code !== "ajt") {
            dataToSend.dateEntree = student.dateEntree;
        }

        const res = await fetch(Ajout_mofif_webhook, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSend)
        });

        if (!res.ok) {
            throw new Error("Network error");
        }
        const text = await res.json();

        if (text.success) {
            console.log("success");
            localStorage.removeItem("studentsData");
            localStorage.setItem("studentsData", JSON.stringify(students));
            localStorage.removeItem("studentToEdit");
            localStorage.removeItem("editIndex");

            const message = (code === "mdf") ? "Étudiant modifié ✅" : "Étudiant ajouté ✅";
            alert(message);

            window.location.href = "list.html";
        }

    } catch (error) {
        console.log(error);
        alert("Erreur ❌");
    }


}


// ===== FILTRAGE =====

function filterStudents() {
    const query = document.getElementById("searchInput").value.toLowerCase().trim();
    const a1Filter = document.getElementById("filterA1").value;
    const a2Filter = document.getElementById("filterA2").value;
    const paramedeFilter = document.getElementById("filterParamede").value;

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
        // Recherche textuelle sécurisée et combinée
        const nom = (s.nom || "").trim().toLowerCase();
        const prenom = (s.prenom || "").trim().toLowerCase();
        const fullName = `${nom} ${prenom}`.trim();
        const reversedFullName = `${prenom} ${nom}`.trim();
        
        const matchesText =
            nom.includes(query) ||
            prenom.includes(query) ||
            fullName.includes(query) ||
            reversedFullName.includes(query) ||
            (s.cin && String(s.cin).toLowerCase().includes(query)) ||
            (s.niveau && String(s.niveau).toLowerCase().includes(query)) ||
            (s.matricule && String(s.matricule).toLowerCase().includes(query)) ||
            (s.Matricule && String(s.Matricule).toLowerCase().includes(query));

        if (!matchesText) return false;

        // Filtres Boolean (A1, A2, Paramede) - Utilise isTrue pour gérer "TRUE"/"FALSE" en texte
        if (a1Filter === "true" && !isTrue(s.a1)) return false;
        if (a1Filter === "false" && isTrue(s.a1)) return false;

        if (a2Filter === "true" && !isTrue(s.a2)) return false;
        if (a2Filter === "false" && isTrue(s.a2)) return false;

        const valPara = (s.Paramede !== undefined ? s.Paramede : s.paramede);
        if (paramedeFilter === "true" && !isTrue(valPara)) return false;
        if (paramedeFilter === "false" && isTrue(valPara)) return false;

        // Filtres Certificats (ET logic : l'étudiant match s'il possède TOUS les modules cochés)
        const checkModulesAnd = (studentVal, activeMods) => {
            if (activeMods.length === 0) return true;
            const sVal = (studentVal || "").toUpperCase();
            // Retourne true uniquement si TOUS les modules cochés sont présents dans la valeur de l'étudiant
            return activeMods.every(mod => sVal.includes(mod.toUpperCase()));
        };

        if (!checkModulesAnd(s.b1, b1Modules)) return false;
        if (!checkModulesAnd(s.b2, b2Modules)) return false;
        if (!checkModulesAnd(s.c1, c1Modules)) return false;
        if (!checkModulesAnd(s.c2, c2Modules)) return false;

        return true;
    });
    displayStudents(filtered);
}


// ===== MODIFIER =====

function editStudent(index) {
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

    // Réactive le champ matricule
    let matriculeField = document.getElementById("idMatricule");
    if (matriculeField) {
        matriculeField.disabled = false;
        matriculeField.classList.remove("bg-gray-100", "cursor-not-allowed");
        matriculeField.title = "";
    }

    // Réinitialise le verrou de soumission
    isSubmitting = false;
}


// ===== SUPPRIMER =====
async function deleteStudent(index) {
    if (confirm("Supprimer cet étudiant ?")) {
        let x = parseInt(students[index].matricule);

        const res = await fetch(Ajout_mofif_webhook, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                numero: x,
                Code: "sup"
            })
        });
        if (!res.ok) {
            throw new Error("Network error");
        }
        const text = await res.json();
        console.log(text.success);

        if (text.success) {
            students.splice(index, 1);
            localStorage.removeItem("studentsData");
            localStorage.setItem("studentsData", JSON.stringify(students));
            alert("Étudiant supprimé ✅");
            displayStudents();
        }
    }
}



// ===== INITIAL =====

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            ajoutermodifierEtudiant();
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
            dateNaissance: ["dateNaissance", "idDateNais"],
            email: ["email", "idEmail"],
            telephone: ["telephone", "idTel"],
            Adresse: ["Adresse", "idAdresse"],
            niveau: ["niveau", "idNiveau"],
            passport: ["passport", "idNumPass"],
            datFinPass: ["datFinPass", "idDatFinPass"],
            numCop: ["numCop", "idNumCop"],
            datFinCop: ["datFinCop", "idDatFinCop"],
            matricule: ["matricule", "idMatricule"],
            Matricule: ["Matricule", "idMatriculeString"],
            cin: ["cin", "idNumCin"],
            facebook: ["facebook", "idfcbk"],
            montantAPayer: ["montantAPayer", "idMontant"],
        };

        for (let key in fields) {
            let el = document.getElementById(fields[key][0]) || document.getElementById(fields[key][1]);
            if (el) {
                let val = student[key] || "";
                if (val && typeof val === "string" && val.includes("T")) {
                    val = isoToDate(val);
                }
                el.value = val;
            }
        }

        // Rempli les checkboxes des certificats
        const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
        setCheck("A1", !!student.a1);
        setCheck("A2", !!student.a2);
        ["C1L", "C1H", "C1M", "C1S"].forEach(id => setCheck(id, (student.c1 || "").includes(id.slice(-1))));
        ["C2L", "C2H", "C2M", "C2S"].forEach(id => setCheck(id, (student.c2 || "").includes(id.slice(-1))));
        ["B1L", "B1H", "B1M", "B1S"].forEach(id => setCheck(id, (student.b1 || "").includes(id.slice(-1))));
        ["B2L", "B2H", "B2M", "B2S"].forEach(id => setCheck(id, (student.b2 || "").includes(id.slice(-1))));
        setCheck("idParamede", !!student.paramede);

        // Désactive le champ matricule lors de la modification
        let matriculeField = document.getElementById("idMatricule");
        if (matriculeField) {
            matriculeField.disabled = true;
            matriculeField.classList.add("bg-gray-100", "cursor-not-allowed");
            matriculeField.title = "Le numero ne peut pas être modifié.";
        }

        // Change le texte du bouton Soumettre en Modifier
        let buttons = document.querySelectorAll("button");
        buttons.forEach(btn => {
            if (btn.textContent.trim().toLowerCase() === "soumettre") {
                btn.textContent = "Modifier";
            }
        });
    } else if (localStorage.getItem("Mtrcl")) {
        document.getElementById("idMatricule").value = localStorage.getItem("Mtrcl");
    }
});

function goToFacture(index) {
    let studentsData = JSON.parse(localStorage.getItem("studentsData"));
    let student = studentsData[index];
    localStorage.setItem("selectedStudent", JSON.stringify(student));
    window.location.href = "facture.html";
}
