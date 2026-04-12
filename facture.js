// facture.js - Shared logic for Payment and Invoice list

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (page === "facture.html") {
        initFacturePage();
    } else if (page === "list-facture.html") {
        initListFacturePage();
    }
});

// --- FACTURE PAGE LOGIC ---

let currentInvoice = null;
let selectedStudent = null;

function initFacturePage() {
    const studentStr = localStorage.getItem("selectedStudent");
    if (!studentStr) {
        alert("Aucun étudiant sélectionné.");
        window.location.href = "list.html";
        return;
    }

    selectedStudent = JSON.parse(studentStr);
    
    // Check if an invoice exists for this student
    const factures = JSON.parse(localStorage.getItem("facturesData") || "[]");
    currentInvoice = factures.find(f => f.matricule === selectedStudent.matricule);

    // If no invoice exists, we just display the form with default values and student info
    // We do NOT save a new invoice to localStorage yet.
    fillFactureForm(currentInvoice || createTemplateInvoice(selectedStudent));
}

function createTemplateInvoice(student) {
    return {
        id: null, // Temporary
        reference: "---",
        dateFacture: new Date().toLocaleDateString('fr-CA'),
        matricule: student.matricule,
        nom: student.nom,
        prenom: student.prenom,
        niveau: student.niveau,
        totalAPayer: 400000,
        dejaPayer: 0,
        reste: 400000,
        paymentNumber: 0,
        payments: []
    };
}

function fillFactureForm(invoice) {
    if (!invoice) return;

    // Student Info (Readonly)
    document.getElementById("matricule").value = invoice.matricule || "";
    document.getElementById("nom").value = invoice.nom || "";
    document.getElementById("prenom").value = invoice.prenom || "";
    document.getElementById("niveau").value = invoice.niveau || "";

    // Invoice Info
    document.getElementById("reference").value = invoice.reference;
    document.getElementById("displayRef").innerText = invoice.reference;
    document.getElementById("dateFacture").value = invoice.dateFacture;
    document.getElementById("paymentNumber").value = invoice.paymentNumber;

    // Amounts
    document.getElementById("totalAPayer").innerText = invoice.totalAPayer.toLocaleString();
    document.getElementById("dejaPayer").innerText = invoice.dejaPayer.toLocaleString();
    document.getElementById("reste").innerText = invoice.reste.toLocaleString();

    // History
    renderPaymentHistory(invoice.payments);
    updateStatusBadge(invoice.reste);

    // Toggle Payment Form Visibility
    const formSection = document.getElementById("paymentFormSection");
    if (formSection) {
        if (invoice.reste <= 0) {
            formSection.classList.add("hidden");
        } else {
            formSection.classList.remove("hidden");
        }
    }
}

function renderPaymentHistory(payments) {
    const tbody = document.getElementById("paymentHistory");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!payments || payments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400 italic">Aucun paiement effectué.</td></tr>`;
        return;
    }

    payments.forEach(p => {
        const row = `
            <tr class="hover:bg-gray-50 border-b border-gray-50">
                <td class="p-4 font-medium text-gray-500">${p.numero}</td>
                <td class="p-4 text-gray-700">${p.date}</td>
                <td class="p-4"><span class="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase">${p.mode}</span></td>
                <td class="p-4 font-bold text-gray-900">${p.montant.toLocaleString()} Ar</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function updateStatusBadge(reste) {
    const badge = document.getElementById("statusBadge");
    if (!badge) return;

    if (reste <= 0) {
        badge.innerText = "SOLDE RÉGLÉ";
        badge.className = "p-3 rounded-lg bg-green-500 text-white text-center font-bold text-sm uppercase tracking-widest mt-6";
    } else {
        badge.innerText = "EN ATTENTE";
        badge.className = "p-3 rounded-lg bg-orange-500 text-white text-center font-bold text-sm uppercase tracking-widest mt-6";
    }
}

function enregistrerPaiement() {
    const montantInput = document.getElementById("nouveauPaiement");
    const modePaiement = document.getElementById("modePaiement").value;
    const reason = document.getElementById("idReason").value || "Acompte";
    const montant = parseFloat(montantInput.value);

    // 1. Validate payment amount
    if (isNaN(montant) || montant <= 0) {
        alert("Veuillez entrer un montant valide.");
        return;
    }

    let factures = JSON.parse(localStorage.getItem("facturesData") || "[]");

    // 2. If NO invoice exists yet, create it now
    if (!currentInvoice) {
        const today = new Date().toLocaleDateString('fr-CA');
        currentInvoice = {
            id: Date.now(),
            reference: "FACT-" + Date.now(),
            dateFacture: today,
            matricule: selectedStudent.matricule,
            nom: selectedStudent.nom,
            prenom: selectedStudent.prenom,
            niveau: selectedStudent.niveau,
            totalAPayer: 400000,
            dejaPayer: 0,
            reste: 400000,
            paymentNumber: 0,
            payments: [],
            reason: reason
        };
        // Don't push yet, wait to update amounts
    }

    if (montant > currentInvoice.reste) {
        if (!confirm("Le montant dépasse le reste à payer. Continuer ?")) {
            return;
        }
    }

    // 3. Update Invoice object
    currentInvoice.paymentNumber++;
    const today = new Date().toLocaleDateString('fr-CA');
    
    const newPayment = {
        numero: currentInvoice.paymentNumber,
        date: today,
        mode: modePaiement,
        montant: montant
    };

    currentInvoice.payments.push(newPayment);
    currentInvoice.dejaPayer += montant;
    currentInvoice.reste = currentInvoice.totalAPayer - currentInvoice.dejaPayer;

    // 4. Save to localStorage
    const index = factures.findIndex(f => f.matricule === currentInvoice.matricule);
    if (index !== -1) {
        factures[index] = currentInvoice;
    } else {
        factures.push(currentInvoice);
    }
    localStorage.setItem("facturesData", JSON.stringify(factures));

    // 5. Clear input and refresh UI
    montantInput.value = "";
    fillFactureForm(currentInvoice);
    alert("Paiement enregistré et facture créée !");
}

// --- LIST FACTURES PAGE LOGIC ---

function initListFacturePage() {
    renderFacturesTable();
}

function renderFacturesTable() {
    const tbody = document.getElementById("facturesTable");
    if (!tbody) return;

    const factures = JSON.parse(localStorage.getItem("facturesData") || "[]");
    tbody.innerHTML = "";

    if (factures.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-gray-400 italic">Aucune facture enregistrée (Payez un acompte pour créer une facture).</td></tr>`;
        return;
    }

    factures.forEach((f, index) => {
        const row = `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="p-4 font-mono text-xs font-bold text-blue-600">${f.reference}</td>
                <td class="p-4 text-sm text-gray-600">${f.dateFacture}</td>
                <td class="p-4 text-sm font-semibold text-gray-800">${f.matricule}</td>
                <td class="p-4 text-sm text-gray-700">${f.nom}</td>
                <td class="p-4 text-sm text-gray-700">${f.prenom}</td>
                <td class="p-4 text-sm text-gray-700">${f.reason}</td>
                <td class="p-4 text-sm text-gray-600 text-center"><span class="px-2 py-0.5 rounded bg-gray-100">${f.niveau}</span></td>
                <td class="p-4 text-sm font-bold text-gray-900">${f.totalAPayer.toLocaleString()}</td>
                <td class="p-4 text-sm font-bold text-green-600">${f.dejaPayer.toLocaleString()}</td>
                <td class="p-4 text-sm font-black ${f.reste > 0 ? 'text-orange-600' : 'text-green-600'}">${f.reste.toLocaleString()}</td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <button onclick="voirFacture('${f.matricule}')" class="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        <button onclick="exportFacturePDF(${index})" class="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm flex items-center gap-1 text-[10px] font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            PDF
                        </button>
                        <button onclick="supprimerFacture(${index})" class="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function voirFacture(matricule) {
    const studentsData = JSON.parse(localStorage.getItem("studentsData") || "[]");
    const student = studentsData.find(s => s.matricule === matricule);
    
    if (student) {
        localStorage.setItem("selectedStudent", JSON.stringify(student));
        window.location.href = "facture.html";
    } else {
        alert("Information de l'étudiant introuvable.");
    }
}

function supprimerFacture(index) {
    if (confirm("Voulez-vous vraiment supprimer cette facture ?")) {
        let factures = JSON.parse(localStorage.getItem("facturesData") || "[]");
        factures.splice(index, 1);
        localStorage.setItem("facturesData", JSON.stringify(factures));
        renderFacturesTable();
    }
}

function exportFacturePDF(index) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const factures = JSON.parse(localStorage.getItem("facturesData") || "[]");
    const f = factures[index];

    if (!f) return;

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 105, 20, { align: "center" });

    // Reference and Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Référence: ${f.reference}`, 20, 35);
    doc.text(`Date: ${f.dateFacture}`, 20, 40);

    // Student Info Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Informations Étudiant:", 20, 55);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Matricule: ${f.matricule}`, 25, 65);
    doc.text(`Nom: ${f.nom}`, 25, 72);
    doc.text(`Prénom: ${f.prenom}`, 25, 79);
    doc.text(`Niveau: ${f.niveau}`, 25, 86);

    // Summary Section
    doc.setFont("helvetica", "bold");
    doc.text("Résumé:", 20, 105);

    doc.setFont("helvetica", "normal");
    doc.text(`Total à payer: ${f.totalAPayer.toLocaleString()} Ar`, 25, 115);
    doc.text(`Déjà payé: ${f.dejaPayer.toLocaleString()} Ar`, 25, 122);
    doc.text(`Reste: ${f.reste.toLocaleString()} Ar`, 25, 129);

    // Payment History Section
    doc.setFont("helvetica", "bold");
    doc.text("Historique des Paiements:", 20, 145);

    // Table
    const tableData = f.payments.map(p => [
        p.numero,
        p.date,
        p.mode,
        `${p.montant.toLocaleString()} Ar`
    ]);

    doc.autoTable({
        startY: 152,
        head: [['N°', 'Date', 'Mode', 'Montant']],
        body: tableData,
        theme: 'plain', // Black and white
        styles: { textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1 },
        headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] }
    });

    // Signature
    const finalY = doc.lastAutoTable.finalY || 152;
    doc.setFont("helvetica", "bold");
    doc.text("Signature", 185, finalY + 25, { align: "right" });

    // Save
    doc.save(`facture_${f.reference}.pdf`);
}
