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
    // Synchronize with totalAPayer from student list
    const total = parseFloat(student.totalAPayer || student.montantAPayer) || 0;
    // Fix: Initialize from backend montantPaye if available
    const deja = parseFloat(student.montantPaye) || 0;
    const reste = total - deja;

    return {
        id: null, // Temporary
        reference: "---",
        dateFacture: new Date().toLocaleDateString('fr-CA'),
        matricule: student.matricule,
        nom: student.nom,
        prenom: student.prenom,
        niveau: student.niveau,
        totalAPayer: total,
        dejaPayer: deja,
        reste: reste,
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

async function enregistrerPaiement() {
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

    // 2. Prepare temporary invoice state
    let tempInvoice = currentInvoice ? JSON.parse(JSON.stringify(currentInvoice)) : null;

    if (!tempInvoice) {
        const today = new Date().toLocaleDateString('fr-CA');
        // Synchronize with totalAPayer and montantPaye from student list
        const total = parseFloat(selectedStudent.totalAPayer || selectedStudent.montantAPayer) || 0;
        const deja = parseFloat(selectedStudent.montantPaye) || 0;
        const reste = total - deja;

        tempInvoice = {
            id: Date.now(),
            reference: "FACT-" + Date.now(),
            dateFacture: today,
            matricule: selectedStudent.matricule,
            nom: selectedStudent.nom,
            prenom: selectedStudent.prenom,
            niveau: selectedStudent.niveau,
            totalAPayer: total,
            dejaPayer: deja,
            reste: reste,
            paymentNumber: 0,
            payments: [],
            reason: reason
        };
    }

    if (montant > tempInvoice.reste) {
        if (!confirm("Le montant dépasse le reste à payer. Continuer ?")) {
            return;
        }
    }

    // 3. Prepare data for the webhook (Final state values)
    const today = new Date().toLocaleDateString('fr-CA');
    const nextPaymentNumber = tempInvoice.paymentNumber + 1;
    const nextDejaPayer = tempInvoice.dejaPayer + montant;
    const nextReste = tempInvoice.totalAPayer - nextDejaPayer;

    const dataToSend = {
        reference: tempInvoice.reference,     // Col A
        matricule: tempInvoice.matricule,     // Col B
        nom: tempInvoice.nom,                 // Col C
        prenom: tempInvoice.prenom,           // Col D
        niveau: tempInvoice.niveau,           // Col E
        TotalApayer: tempInvoice.totalAPayer, // Col F
        montantPaye: nextDejaPayer,           // Col G
        Aktuell_pay: montant,                 // Col H
        paiement: nextReste <= 0 ? "PAYE" : "EN COURS", // Col I
        DejatPayer: nextDejaPayer,            // Col J
        reste: nextReste,                     // Col K
        modePaiement: modePaiement,           // Col L
        raison: reason,                       // Col M
        numeroPaiemen: nextPaymentNumber,     // Col N
        datePaiement: today                    // Col O
    };

    // 4. Send to Webhook with Timeout Protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
        console.log("Sending to Webhook:", dataToSend);

        const response = await fetch("https://hook.us2.make.com/jpylueiuew4elziiderefx1rdvld51dn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSend),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const result = await response.json();

        // Ensure backend explicitly confirmed success
        if (result && result.success === false) {
            throw new Error("Webhook returned success:false");
        }

        console.log("Webhook success confirmed");

        // 5. Update Invoice object locally only after confirmed webhook success
        tempInvoice.paymentNumber = nextPaymentNumber;
        tempInvoice.payments.push({
            numero: nextPaymentNumber,
            date: today,
            mode: modePaiement,
            montant: montant
        });
        tempInvoice.dejaPayer = nextDejaPayer;
        tempInvoice.reste = nextReste;

        // Commit to global currentInvoice
        currentInvoice = tempInvoice;

        // 6. Save to localStorage
        const index = factures.findIndex(f => f.matricule === currentInvoice.matricule);
        if (index !== -1) {
            factures[index] = currentInvoice;
        } else {
            factures.push(currentInvoice);
        }
        localStorage.setItem("facturesData", JSON.stringify(factures));

        // 7. Clear input and refresh UI
        montantInput.value = "";
        fillFactureForm(currentInvoice);
        alert("Paiement enregistré avec succès.");

    } catch (error) {
        console.error("Webhook error:", error);
        alert("Erreur : connexion impossible. Paiement non enregistré.");
    }
}

// --- LIST FACTURES PAGE LOGIC ---

let allFactures = []; // Global storage for facture data

// Convertit une date ISO (ex: "2026-04-14T00:00:00.000Z") en "14/04/2026"
function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // Si déjà formatée, la retourner telle quelle
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function initListFacturePage() {
    // 1. Afficher instantanément depuis localStorage
    const cached = JSON.parse(localStorage.getItem("facturesData") || "[]");
    if (cached.length > 0) {
        allFactures = cached;
        renderFacturesTableLocale();
    }
    // 2. Synchronisation automatique en arrière-plan (silencieuse)
    syncFacturesDepuisServeur();
}

// Rendu local (depuis allFactures) sans appel réseau — déclenche le filtre après chargement
function renderFacturesTableLocale() {
    const counter = document.getElementById("facturesCount");
    if (counter) counter.textContent = allFactures.length + " facture(s)";

    // Après chaque chargement, ré-appliquer les filtres actifs (ou tout afficher)
    filtrerFactures();
}

// ===== LOGIQUE DE FILTRAGE =====

/**
 * Appelé à chaque saisie dans l'un des deux champs de filtre.
 * Les deux filtres s'appliquent simultanément (ET logique).
 */
function filtrerFactures() {
    const tbody = document.getElementById("facturesTable");
    if (!tbody) return;

    const texte  = (document.getElementById("filterTexte")?.value  || "").trim().toLowerCase();
    const numero = (document.getElementById("filterNumero")?.value || "").trim();

    // Afficher / masquer les boutons "×" selon si un filtre est actif
    const btnClearTexte  = document.getElementById("clearTexte");
    const btnClearNumero = document.getElementById("clearNumero");
    if (btnClearTexte)  btnClearTexte.classList.toggle("hidden", texte === "");
    if (btnClearNumero) btnClearNumero.classList.toggle("hidden", numero === "");

    tbody.innerHTML = "";

    if (!allFactures || allFactures.length === 0) {
        tbody.innerHTML = `<tr><td colspan="14" class="p-12 text-center text-gray-400 italic">Aucune facture en cache. Cliquez sur Actualiser.</td></tr>`;
        return;
    }

    const resultats = allFactures.filter((f, _i) => {
        // ── Filtre texte (référence, nom, prénom, niveau) ──
        let passTexte = true;
        if (texte !== "") {
            const ref    = (f.reference    || "").toLowerCase();
            const nom    = (f.nom          || "").toLowerCase();
            const prenom = (f.prenom       || "").toLowerCase();
            const niveau = (f.niveau       || "").toLowerCase();
            passTexte = ref.includes(texte) || nom.includes(texte) ||
                        prenom.includes(texte) || niveau.includes(texte);
        }

        // ── Filtre numéro de paiement (chiffres uniquement, correspondance exacte) ──
        let passNumero = true;
        if (numero !== "") {
            const numPaie = String(f.numeroPaiement || f.numeroPaiemen || "");
            passNumero = numPaie === numero;
        }

        return passTexte && passNumero;
    });

    // Mise à jour du compteur de résultats
    const filterResult = document.getElementById("filterResult");
    if (filterResult) {
        if (texte !== "" || numero !== "") {
            filterResult.textContent = `${resultats.length} résultat(s) sur ${allFactures.length}`;
        } else {
            filterResult.textContent = "";
        }
    }

    if (resultats.length === 0) {
        tbody.innerHTML = `<tr><td colspan="14" class="p-10 text-center text-gray-400 italic">Aucune facture ne correspond aux critères.</td></tr>`;
        return;
    }

    resultats.forEach((f, index) => {
        // Retrouver l'index réel dans allFactures pour les boutons PDF/Supprimer
        const realIndex = allFactures.indexOf(f);
        const row = `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="p-4 font-mono text-[10px] font-bold text-blue-600">${f.reference || "-"}</td>
                <td class="p-4 text-xs text-gray-600 whitespace-nowrap">${formatDate(f.date || f.datePaiement)}</td>
                <td class="p-4 text-sm font-semibold text-gray-800">${f.matricule || "-"}</td>
                <td class="p-4 text-sm text-gray-700">${f.nom || "-"}</td>
                <td class="p-4 text-sm text-gray-700">${f.prenom || "-"}</td>
                <td class="p-4 text-center"><span class="px-2 py-0.5 rounded bg-gray-100 text-[10px] whitespace-nowrap">${f.niveau || "-"}</span></td>
                <td class="p-4 text-xs text-gray-600">${f.raison || "-"}</td>
                <td class="p-4 text-xs text-gray-600">${f.modePaiement || "-"}</td>
                <td class="p-4 text-center text-xs text-gray-600 font-bold">${f.numeroPaiement || f.numeroPaiemen || "-"}</td>
                <td class="p-4 text-center text-xs font-bold text-blue-600 bg-blue-50/50">${f.paiement || "0"}</td>
                <td class="p-4 text-sm font-bold text-green-600 whitespace-nowrap">${Number(f.montantPaye || 0).toLocaleString()} Ar</td>
                <td class="p-4 text-sm font-bold text-gray-900 whitespace-nowrap">${Number(f.totalAPayer || 0).toLocaleString()} Ar</td>
                <td class="p-4 text-sm font-black ${parseFloat(f.reste) > 0 ? 'text-orange-600' : 'text-green-600'} whitespace-nowrap">${Number(f.reste || 0).toLocaleString()} Ar</td>
                <td class="p-4">
                    <div class="flex items-center gap-1">
                        <button onclick="exportFacturePDF(${realIndex})" class="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm" title="Exporter PDF">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </button>
                        <button onclick="supprimerFacture(${realIndex})" class="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Supprimer">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

/**
 * Empêche la saisie de tout caractère non numérique dans le champ N° Paiement.
 */
function onNumeroInput(input) {
    input.value = input.value.replace(/\D/g, "");
}

/**
 * Efface un champ de filtre donné et relance le filtrage.
 */
function clearFilter(fieldId) {
    const el = document.getElementById(fieldId);
    if (el) { el.value = ""; el.focus(); }
    filtrerFactures();
}
// ===== FIN LOGIQUE DE FILTRAGE =====

// Synchronisation depuis le serveur webhook → met à jour le localStorage
async function syncFacturesDepuisServeur() {
    const tbody = document.getElementById("facturesTable");
    if (!tbody) return;

    // Montrer le spinner seulement si aucun cache n'est affiché
    if (allFactures.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="14" class="p-12 text-center">
                    <div class="flex flex-col items-center justify-center gap-3">
                        <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p class="text-gray-500 font-medium">Chargement des factures...</p>
                    </div>
                </td>
            </tr>
        `;
    }

    try {
        const response = await fetch("https://hook.us2.make.com/3xpwsogtxqlqiiw1f9xnji1hl75x04c6");

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

        const data = await response.json();
        allFactures = Array.isArray(data) ? data : [];

        // Sauvegarder dans localStorage
        localStorage.setItem("facturesData", JSON.stringify(allFactures));
        renderFacturesTableLocale();

    } catch (error) {
        console.error("Erreur sync factures:", error);
        // En cas d'erreur réseau, conserver l'affichage du cache
        if (allFactures.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="14" class="p-12 text-center text-red-500">
                        <div class="flex flex-col items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <p class="font-bold text-lg">Impossible de charger les factures</p>
                            <p class="text-sm opacity-70">Vérifiez votre connexion.</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
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
    if (confirm("Voulez-vous vraiment supprimer cette facture de la liste ?")) {
        allFactures.splice(index, 1);
        // Persister la suppression dans localStorage
        localStorage.setItem("facturesData", JSON.stringify(allFactures));
        renderFacturesTableLocale();
    }
}

function exportFacturePDF(index) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const f = allFactures[index];

    if (!f) return;

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 105, 20, { align: "center" });

    // Reference and Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Référence: ${f.reference || "-"}`, 20, 35);
    doc.text(`Date: ${formatDate(f.date || f.dateFacture)}`, 20, 40);

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
    doc.text(`Total à payer: ${Number(f.totalAPayer || 0).toLocaleString()} Ar`, 25, 115);
    doc.text(`Déjà payé: ${Number(f.montantPaye || 0).toLocaleString()} Ar`, 25, 122);
    doc.text(`Reste: ${Number(f.reste || 0).toLocaleString()} Ar`, 25, 129);

    // Payment History Section
    doc.setFont("helvetica", "bold");
    doc.text("Historique des Paiements:", 20, 145);

    // Table (Using data from the object)
    const tableData = [[
        f.numeroPaiement || "1",
        formatDate(f.date || f.datePaiement),
        f.modePaiement || "-",
        `${Number(f.montantPaye || 0).toLocaleString()} Ar`
    ]];

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
