
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

function btnAjout(){
    let students = JSON.parse(localStorage.getItem("studentsData"));
    if (localStorage.getItem("Mtrcl")) {
        localStorage.removeItem("Mtrcl");
        console.log("Mtrcl removed");
    }
    localStorage.removeItem("studentToEdit");
    localStorage.removeItem("editIndex");
    localStorage.setItem("Mtrcl",parseInt(students[students.length -1].matricule)+1);
    location.href = "index.html";
}

const ETUDIENT_WEBHOOK = "https://hook.us2.make.com/pu7n7c9lh533ckeftgk7t7e83ls4o8sx";
async function fetchStudents() {
    const res = await fetch(ETUDIENT_WEBHOOK, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: "fetch_students"
        })
    });

    // Récupération de la réponse
    const data = await res.json();
    students = data;
    console.log(data);
    return data;

}

let students = [];
console.log("ok");
async function loadStudents() {

    if (localStorage.getItem("studentsData")) {
        students = JSON.parse(localStorage.getItem("studentsData"));

    } else {
        //hook de waiis
        students = await fetchStudents();
        localStorage.setItem("studentsData", JSON.stringify(students));
    }
}
window.onload = loadStudents;
let editIndex = null;
students = localStorage.getItem("studentsData") ? JSON.parse(localStorage.getItem("studentsData")) : [];
console.log(students);


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
<td class="p-[14px] text-gray-700 font-medium">${s.nom}</td>
<td class="p-[14px] text-gray-700">${s.prenom}</td>
<td class="p-[14px] text-gray-700">${isoToDate(s.dateNaissance) || '–'}</td>
<td class="p-[14px] text-gray-700 font-bold">${calculateAge(s.dateNaissance)}</td>
<td class="p-[14px] text-gray-700">${s.cin || '–'}</td>
<td class="p-[14px] text-gray-700">${s.email}</td>
<td class="p-[14px] text-gray-700">${s.telephone || '–'}</td>
<td class="p-[14px] text-gray-700">${s.Adresse || '–'}</td>
<td class="p-[14px] text-gray-700">${s.niveau}</td>
<td class="p-[14px] text-gray-700 font-bold">${total.toLocaleString()} Ar</td>
<td class="p-[14px] text-gray-700 font-bold text-green-600">${montantPaye.toLocaleString()} Ar</td>
<td class="p-[14px] text-gray-700 font-bold text-orange-600">${reste.toLocaleString()} Ar</td>
<td class="p-[14px] text-center">
    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${paiementStatus === 'Payé' ? 'bg-green-100 text-green-700 border border-green-200' : paiementStatus === 'En cours' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-red-100 text-red-700 border border-red-200'}">
        ${paiementStatus}
    </span>
</td>
<td class="p-[14px] text-center text-gray-700">${s.a1 ? 'Oui' : 'Non'}</td>
<td class="p-[14px] text-center text-gray-700">${s.a2 ? 'Oui' : 'Non'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.c1 || '–'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.c2 || '–'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.b1 || '–'}</td>
<td class="p-[14px] text-gray-700 font-mono">${s.b2 || '–'}</td>
<td class="p-[14px] text-center text-gray-700">${s.paramede ? 'Oui' : 'Non'}</td>
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
let Ajout_mofif_webhook = "https://hook.us2.make.com/l3ykkvvwvvfws27xb1gkylc2bef1xpp3";
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

    let student = {
        id: editIndexParam !== null ? students[editIndexParam].id : Date.now(),
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
            matricule: student.matricule,
            nom: student.nom,
            prenom: student.prenom,
            dateNaissance: dateToISO(student.dateNaissance),
            dateEntree: student.dateEntree,
            email: student.email,
            telephone: student.telephone,
            facebook: student.facebook,
            niveau: student.niveau,
            totalAPayer: student.montantAPayer,
            // Payments are handled in facturesData, not here
            A1: student.a1,
            A2: student.a2,
            B1: student.b1,
            B2: student.b2,
            C1: student.c1,
            C2: student.c2,
            Code: code,
            Adresse: student.Adresse,
            Paramede: student.paramede,
            numPassport: student.passport,
            expPassport: dateToISO(student.datFinPass),
            numCop: student.numCop,
            expCop: dateToISO(student.datFinCop),
            cin: student.cin,
            facebook: student.facebook
        };

        const res = await fetch(Ajout_mofif_webhook, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSend)
        });

        const text = await res.json();

        if (text.success) {
            console.log("success");
            localStorage.removeItem("studentsData");
            localStorage.setItem("studentsData", JSON.stringify(students));
            localStorage.removeItem("studentToEdit");
            localStorage.removeItem("editIndex");
            alert("Étudiant ajouté ✅");
            window.location.href = "list.html";
        }

    } catch (error) {
        console.log(error);
        alert("Erreur ❌");
    }


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
            matriculeField.title = "Le matricule ne peut pas être modifié.";
        }

        // Change le texte du bouton Soumettre en Modifier
        let buttons = document.querySelectorAll("button");
        buttons.forEach(btn => {
            if (btn.textContent.trim().toLowerCase() === "soumettre") {
                btn.textContent = "Modifier";
            }
        });
    }else if (localStorage.getItem("Mtrcl")){
        document.getElementById("idMatricule").value = localStorage.getItem("Mtrcl");
    }
});

function goToFacture(index) {
    let studentsData = JSON.parse(localStorage.getItem("studentsData"));
    let student = studentsData[index];
    localStorage.setItem("selectedStudent", JSON.stringify(student));
    window.location.href = "facture.html";
}
