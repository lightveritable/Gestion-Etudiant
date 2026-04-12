// ===== EXPORT PDF =====

const COLUMN_LABELS = {
    matricule:   "Matricule",
    nom:        "Nom",
    prenom:     "Prénom",
    dateNais:   "Date de naissance",
    cin:        "CIN",
    email:      "Email",
    tel:        "Téléphone",
    adresse:    "Adresse",
    niveau:     "Niveau",
    montantAPayer: "Montant à payer",
    a1:         "A1",
    a2:         "A2",
    c1:         "C1",
    c2:         "C2",
    b1:         "B1",
    b2:         "B2",
    paramede:   "Paramède",
    passport:   "Passport N°",
    datFinPass: "Exp. Passport",
    numCop:     "Copia N°",
    datFinCop:  "Exp. Copia",
    age:        "Age"
};

function openExportModal() {
    document.getElementById("exportModal").classList.remove("hidden");
}

function closeExportModal() {
    document.getElementById("exportModal").classList.add("hidden");
}

function exportPDF() {
    // 1. Récupérer les colonnes cochées
    const checkboxes = document.querySelectorAll(".export-col-checkbox:checked");
    const selectedKeys = Array.from(checkboxes).map(cb => cb.value);

    if (selectedKeys.length === 0) {
        alert("Veuillez sélectionner au moins une colonne.");
        return;
    }

    // 2. Lire les étudiants depuis localStorage
    const studentsRaw = localStorage.getItem("studentsData");
    const students = studentsRaw ? JSON.parse(studentsRaw) : [];

    // 3. Construire les en-têtes et les lignes
    const headers = selectedKeys.map(key => COLUMN_LABELS[key] || key);
    const rows = students.map(s =>
        selectedKeys.map(key => {
            if (key === 'age') {
                return typeof calculateAge === 'function' ? calculateAge(s.dateNaissance) : '–';
            }
            const val = s[key];
            if (key === 'a1' || key === 'a2' || key === 'paramede') return val ? 'Oui' : 'Non';
            return (val !== undefined && val !== '' && val !== null) ? val : '–';
        })
    );

    // 4. Générer le PDF avec jsPDF + autoTable
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(14);
    doc.text("Liste des Étudiants", 14, 16);
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")}`, 14, 23);

    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 28,
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255,
            fontStyle: "bold",
        },
        alternateRowStyles: {
            fillColor: [241, 245, 249],
        },
        margin: { left: 14, right: 14 },
    });

    // 5. Sauvegarder le fichier
    doc.save("liste_etudiants.pdf");

    closeExportModal();
}

