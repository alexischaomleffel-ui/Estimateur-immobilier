import { useState, useMemo, useEffect, useRef } from "react";
import {
  Home,
  Hammer,
  Banknote,
  PieChart,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Carnet de l'investisseur — estimation location saisonnière        */
/* ------------------------------------------------------------------ */

const CSS = `
:root{
  --paper:#EAEEF1; --card:#FFFFFF; --ink:#15283B; --ink-soft:#4A5C6E;
  --line:#D5DCE2; --brass:#A6741C; --brass-soft:#F1E6CF;
  --pos:#1C7A52; --pos-soft:#E2F1E9; --neg:#B23B2E; --neg-soft:#F6E3DF;
  --shadow:0 1px 2px rgba(21,40,59,.06),0 8px 24px rgba(21,40,59,.05);
}
*{box-sizing:border-box}
.cidv{
  font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:var(--paper); color:var(--ink); min-height:100vh;
  font-variant-numeric:tabular-nums; -webkit-font-smoothing:antialiased;
}
.cidv .serif{font-family:"Fraunces",Georgia,"Times New Roman",serif;}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px 64px;}

/* header */
.head{display:flex;align-items:flex-end;justify-content:space-between;
  gap:16px;flex-wrap:wrap;padding:30px 0 18px;}
.head .eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;
  color:var(--brass);font-weight:600;margin:0 0 4px;}
.head h1{font-size:30px;line-height:1.05;margin:0;font-weight:600;letter-spacing:-.01em;}
.head p{margin:6px 0 0;color:var(--ink-soft);font-size:14px;max-width:46ch;}
.reset{display:inline-flex;align-items:center;gap:7px;background:transparent;
  border:1px solid var(--line);color:var(--ink-soft);border-radius:8px;
  padding:8px 13px;font-size:13px;font-weight:500;cursor:pointer;transition:.15s;font-family:inherit;}
.reset:hover{border-color:var(--brass);color:var(--brass);}

/* sticky synthesis strip */
.strip{position:sticky;top:0;z-index:20;background:var(--ink);color:#fff;
  border-radius:14px;box-shadow:var(--shadow);display:grid;
  grid-template-columns:repeat(4,1fr);overflow:hidden;margin-bottom:22px;}
.strip-item{padding:14px 18px;border-left:1px solid rgba(255,255,255,.1);}
.strip-item:first-child{border-left:none;}
.strip-item .k{font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;
  color:#9DB2C4;font-weight:600;margin-bottom:5px;display:block;}
.strip-item .v{font-size:21px;font-weight:600;line-height:1;}
.strip-item .v.pos{color:#6FD3A2;} .strip-item .v.neg{color:#F3A097;}
.strip-item .v .serif{font-size:23px;}

/* tabs */
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:22px;
  flex-wrap:wrap;}
.tab{display:inline-flex;align-items:center;gap:8px;background:transparent;border:none;
  padding:11px 16px;font-size:14px;font-weight:500;color:var(--ink-soft);cursor:pointer;
  border-bottom:2px solid transparent;margin-bottom:-1px;font-family:inherit;transition:.15s;}
.tab:hover{color:var(--ink);}
.tab.active{color:var(--ink);border-bottom-color:var(--brass);font-weight:600;}
.tab .n{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;
  border-radius:5px;background:var(--brass-soft);color:var(--brass);font-size:11px;font-weight:700;}
.tab.active .n{background:var(--brass);color:#fff;}

/* cards */
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;
  padding:20px 20px 8px;box-shadow:var(--shadow);}
.card.full{grid-column:1/-1;}
.card h3{font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink);
  margin:0 0 4px;font-weight:700;}
.card .sub{font-size:12.5px;color:var(--ink-soft);margin:0 0 14px;}

/* field */
.fld{display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:9px 0;border-bottom:1px dashed var(--line);}
.fld:last-of-type{border-bottom:none;}
.fld .lab{font-size:14px;color:var(--ink);line-height:1.25;}
.fld .lab small{display:block;color:var(--ink-soft);font-size:11.5px;margin-top:2px;}
.inwrap{position:relative;flex:0 0 auto;}
.inwrap input,.inwrap select{font-family:inherit;font-size:14px;font-weight:600;
  color:var(--ink);text-align:right;width:140px;background:#fff;border:1px solid var(--line);
  border-radius:8px;padding:9px 30px 9px 11px;transition:.12s;font-variant-numeric:tabular-nums;}
.inwrap.pct input{padding-right:28px;}
.inwrap select{padding:9px 11px;text-align:left;cursor:pointer;width:170px;}
.inwrap input:focus,.inwrap select:focus{outline:none;border-color:var(--brass);
  box-shadow:0 0 0 3px var(--brass-soft);}
.inwrap input:disabled{background:#F4F6F8;color:var(--ink-soft);}
.inwrap .suf{position:absolute;right:11px;top:50%;transform:translateY(-50%);
  font-size:13px;color:var(--ink-soft);pointer-events:none;}

/* sub total row inside a card */
.calc{display:flex;align-items:center;justify-content:space-between;
  margin:6px -20px 0;padding:13px 20px;background:#FAFBFC;border-top:1px solid var(--line);
  border-radius:0 0 14px 14px;}
.calc .lab{font-size:13px;font-weight:600;color:var(--ink);}
.calc .val{font-size:18px;font-weight:700;}
.calc .val .serif{font-size:19px;}

/* toggle line */
.toggle{display:flex;align-items:center;gap:9px;padding:9px 0;font-size:13.5px;color:var(--ink-soft);}
.toggle input{width:16px;height:16px;accent-color:var(--brass);cursor:pointer;}

/* note */
.note{display:flex;gap:9px;align-items:flex-start;background:var(--brass-soft);
  color:#6e4e14;border-radius:10px;padding:11px 13px;font-size:12.5px;line-height:1.45;margin-top:4px;}
.note svg{flex:0 0 auto;margin-top:1px;}

/* synthese */
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px;}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;
  box-shadow:var(--shadow);}
.kpi .k{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);
  font-weight:600;margin-bottom:8px;}
.kpi .v{font-size:27px;font-weight:600;line-height:1;}
.kpi .v.pos{color:var(--pos);} .kpi .v.neg{color:var(--neg);}
.kpi .foot{font-size:12px;color:var(--ink-soft);margin-top:7px;}
@media(max-width:760px){.kpis{grid-template-columns:1fr 1fr;}}

.verdict{display:flex;align-items:center;gap:14px;border-radius:14px;padding:18px 20px;
  font-size:15px;font-weight:500;margin-bottom:18px;line-height:1.4;}
.verdict.pos{background:var(--pos-soft);color:#15623f;}
.verdict.neg{background:var(--neg-soft);color:#8d2c20;}
.verdict .big{font-weight:700;}
.verdict svg{flex:0 0 auto;}

/* ledger */
.ledger{width:100%;border-collapse:collapse;font-size:14px;}
.ledger td{padding:11px 0;border-bottom:1px dashed var(--line);}
.ledger td:last-child{text-align:right;font-weight:600;font-variant-numeric:tabular-nums;}
.ledger tr.tot td{border-bottom:none;border-top:2px solid var(--ink);padding-top:13px;
  font-weight:700;font-size:15px;}
.ledger tr.sub td{color:var(--ink-soft);font-weight:500;}
.ledger tr.sub td:last-child{font-weight:600;}
.ledger .neg{color:var(--neg);} .ledger .pos{color:var(--pos);}

/* bar */
.bar{display:flex;height:26px;border-radius:7px;overflow:hidden;margin:14px 0 8px;
  background:#EDF0F3;}
.bar > span{height:100%;}
.legend{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--ink-soft);}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;
  vertical-align:middle;}

@media(max-width:760px){
  .grid{grid-template-columns:1fr;}
  .strip{grid-template-columns:1fr 1fr;}
  .strip-item:nth-child(3){border-left:none;}
  .head h1{font-size:25px;}
}
@media(max-width:440px){
  .inwrap input{width:118px;} .inwrap select{width:150px;}
}
`;

const FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";

const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
};
const eur = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
const pct = (n) => `${n.toFixed(1).replace(".", ",")} %`;

/* mensualité d'un prêt amortissable */
function pmt(capital, tauxAnnuel, annees) {
  const nb = annees * 12;
  const r = tauxAnnuel / 100 / 12;
  if (nb <= 0) return 0;
  if (r === 0) return capital / nb;
  return (capital * r) / (1 - Math.pow(1 + r, -nb));
}

const DEFAULTS = {
  // achat
  prixAchat: "",
  typeBien: "ancien",
  notaireAuto: true,
  fraisNotaire: "",
  fraisAgence: "",
  fraisGarantie: "",
  fraisDossier: "",
  fraisCourtage: "",
  chasseur: "",
  autresAchat: "",
  // travaux
  grosOeuvre: "",
  plomberieElec: "",
  cuisine: "",
  sdb: "",
  solsPeinture: "",
  archi: "",
  autresTravaux: "",
  // mobilier
  mobilier: "",
  electromenager: "",
  literie: "",
  artTable: "",
  deco: "",
  exterieur: "",
  domotique: "",
  // financement
  apport: "",
  tauxInteret: "3.5",
  duree: "20",
  tauxAssurance: "0.34",
  // revenus
  prixNuit: "",
  tauxOccupation: "60",
  fraisPlateforme: "3",
  // charges
  conciergerie: "20",
  copropriete: "",
  taxeFonciere: "",
  assurancePNO: "",
  cfe: "",
  comptable: "",
  energie: "",
  internet: "",
  entretien: "",
  provisionTravaux: "",
  autresCharges: "",
  // fiscalité
  estimImpot: false,
  regime: "micro",
  abattement: "50",
  tmi: "30",
  prelevSociaux: "17.2",
  resultatReel: "",
};

const STORE_KEY = "carnet-investisseur-v1";

export default function App() {
  const [tab, setTab] = useState(0);
  const [d, setD] = useState(DEFAULTS);
  const loaded = useRef(false);

  // chargement persistant
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage?.get(STORE_KEY);
        if (r?.value) setD({ ...DEFAULTS, ...JSON.parse(r.value) });
      } catch (e) {
        /* première utilisation */
      } finally {
        loaded.current = true;
      }
    })();
  }, []);

  // sauvegarde (débouncée)
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      try {
        window.storage?.set(STORE_KEY, JSON.stringify(d));
      } catch (e) {}
    }, 400);
    return () => clearTimeout(t);
  }, [d]);

  const set = (k) => (e) => setD((s) => ({ ...s, [k]: e.target.value }));
  const setVal = (k, v) => setD((s) => ({ ...s, [k]: v }));

  /* ---------------------- calculs ---------------------- */
  const m = useMemo(() => {
    const prixAchat = num(d.prixAchat);
    const notaireRate = d.typeBien === "neuf" ? 0.025 : 0.08;
    const notaireAutoVal = prixAchat * notaireRate;
    const fraisNotaire = d.notaireAuto ? notaireAutoVal : num(d.fraisNotaire);

    const totalAchat =
      prixAchat +
      fraisNotaire +
      num(d.fraisAgence) +
      num(d.fraisGarantie) +
      num(d.fraisDossier) +
      num(d.fraisCourtage) +
      num(d.chasseur) +
      num(d.autresAchat);

    const totalTravaux =
      num(d.grosOeuvre) +
      num(d.plomberieElec) +
      num(d.cuisine) +
      num(d.sdb) +
      num(d.solsPeinture) +
      num(d.archi) +
      num(d.autresTravaux);

    const totalMobilier =
      num(d.mobilier) +
      num(d.electromenager) +
      num(d.literie) +
      num(d.artTable) +
      num(d.deco) +
      num(d.exterieur) +
      num(d.domotique);

    const totalTM = totalTravaux + totalMobilier;
    const coutProjet = totalAchat + totalTM;

    const apport = num(d.apport);
    const emprunt = Math.max(0, coutProjet - apport);
    const mensCredit = pmt(emprunt, num(d.tauxInteret), num(d.duree));
    const mensAssur = (emprunt * (num(d.tauxAssurance) / 100)) / 12;
    const mensTot = mensCredit + mensAssur;
    const annuelCredit = mensTot * 12;
    const coutCredit = mensTot * num(d.duree) * 12 - emprunt;

    // revenus
    const nuits = (365 * num(d.tauxOccupation)) / 100;
    const revenuBrut = num(d.prixNuit) * nuits;
    const plateformeEur = (revenuBrut * num(d.fraisPlateforme)) / 100;
    const conciergerieEur = (revenuBrut * num(d.conciergerie)) / 100;

    const chargesFixes =
      num(d.copropriete) +
      num(d.taxeFonciere) +
      num(d.assurancePNO) +
      num(d.cfe) +
      num(d.comptable) +
      num(d.energie) +
      num(d.internet) +
      num(d.entretien) +
      num(d.provisionTravaux) +
      num(d.autresCharges);

    const chargesExploit = chargesFixes + plateformeEur + conciergerieEur;
    const revenuNetExploit = revenuBrut - chargesExploit; // avant crédit & impôt
    const cashflowAvImpot = revenuNetExploit - annuelCredit;

    // fiscalité (estimation simplifiée)
    let impot = 0;
    if (d.estimImpot) {
      const taux = (num(d.tmi) + num(d.prelevSociaux)) / 100;
      if (d.regime === "micro") {
        const base = revenuBrut * (1 - num(d.abattement) / 100);
        impot = base * taux;
      } else if (d.regime === "reel") {
        impot = Math.max(0, num(d.resultatReel)) * taux;
      }
    }
    const cashflowApImpot = cashflowAvImpot - impot;

    const rentaBrute = coutProjet > 0 ? (revenuBrut / coutProjet) * 100 : 0;
    const rentaNette = coutProjet > 0 ? (revenuNetExploit / coutProjet) * 100 : 0;
    const rentaNetteNette =
      coutProjet > 0 ? ((revenuNetExploit - impot) / coutProjet) * 100 : 0;
    const cashOnCash = apport > 0 ? (cashflowApImpot / apport) * 100 : 0;

    return {
      notaireAutoVal,
      fraisNotaire,
      totalAchat,
      totalTravaux,
      totalMobilier,
      totalTM,
      coutProjet,
      apport,
      emprunt,
      mensTot,
      mensCredit,
      mensAssur,
      annuelCredit,
      coutCredit,
      nuits,
      revenuBrut,
      plateformeEur,
      conciergerieEur,
      chargesExploit,
      revenuNetExploit,
      cashflowAvImpot,
      impot,
      cashflowApImpot,
      rentaBrute,
      rentaNette,
      rentaNetteNette,
      cashOnCash,
    };
  }, [d]);

  const reset = () => {
    if (window.confirm("Réinitialiser toutes les données du projet ?")) {
      setD(DEFAULTS);
      setTab(0);
    }
  };

  const cfMois = m.cashflowApImpot / 12;
  const cfClass = cfMois >= 0 ? "pos" : "neg";

  /* ---------------------- rendu ---------------------- */
  return (
    <div className="cidv">
      <link rel="stylesheet" href={FONTS} />
      <style>{CSS}</style>
      <div className="wrap">
        <header className="head">
          <div>
            <p className="eyebrow">Carnet de l'investisseur</p>
            <h1 className="serif">Estimation — location de vacances</h1>
            <p>
              Renseignez votre projet poste par poste. La rentabilité et le
              cash-flow se recalculent en direct. Vos saisies sont conservées
              sur cet appareil.
            </p>
          </div>
          <button className="reset" onClick={reset}>
            <RotateCcw size={15} /> Réinitialiser
          </button>
        </header>

        {/* bandeau synthèse permanent */}
        <div className="strip">
          <div className="strip-item">
            <span className="k">Coût du projet</span>
            <span className="v">
              <span className="serif">{eur(m.coutProjet)}</span>
            </span>
          </div>
          <div className="strip-item">
            <span className="k">Mensualité crédit</span>
            <span className="v">
              <span className="serif">{eur(m.mensTot)}</span>
            </span>
          </div>
          <div className="strip-item">
            <span className="k">Cash-flow / mois</span>
            <span className={`v ${cfClass}`}>
              <span className="serif">{eur(cfMois)}</span>
            </span>
          </div>
          <div className="strip-item">
            <span className="k">Rentabilité nette</span>
            <span className="v">
              <span className="serif">{pct(m.rentaNette)}</span>
            </span>
          </div>
        </div>

        {/* onglets */}
        <nav className="tabs">
          {[
            ["Achat", Home],
            ["Travaux & Mobilier", Hammer],
            ["Financement & Location", Banknote],
            ["Synthèse", PieChart],
          ].map(([label, Icon], i) => (
            <button
              key={i}
              className={`tab ${tab === i ? "active" : ""}`}
              onClick={() => setTab(i)}
            >
              <span className="n">{i + 1}</span>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        {/* -------- onglet 1 : ACHAT -------- */}
        {tab === 0 && (
          <div className="grid">
            <Card title="Prix & frais d'acquisition" sub="Le cœur de l'opération.">
              <Field label="Prix d'achat" sub="Net vendeur ou FAI">
                <Money v={d.prixAchat} on={set("prixAchat")} />
              </Field>
              <Field label="Type de bien" sub="Détermine les frais de notaire">
                <div className="inwrap">
                  <select value={d.typeBien} onChange={set("typeBien")}>
                    <option value="ancien">Ancien (~8 %)</option>
                    <option value="neuf">Neuf / VEFA (~2,5 %)</option>
                  </select>
                </div>
              </Field>
              <div className="toggle">
                <input
                  type="checkbox"
                  id="na"
                  checked={d.notaireAuto}
                  onChange={(e) => setVal("notaireAuto", e.target.checked)}
                />
                <label htmlFor="na">
                  Estimer les frais de notaire automatiquement
                  {d.notaireAuto && num(d.prixAchat) > 0 && (
                    <> — {eur(m.notaireAutoVal)}</>
                  )}
                </label>
              </div>
              <Field label="Frais de notaire" sub="Émoluments, droits & débours">
                <Money
                  v={d.notaireAuto ? Math.round(m.notaireAutoVal) : d.fraisNotaire}
                  on={set("fraisNotaire")}
                  disabled={d.notaireAuto}
                />
              </Field>
              <Field label="Frais d'agence" sub="Si non inclus dans le prix">
                <Money v={d.fraisAgence} on={set("fraisAgence")} />
              </Field>
            </Card>

            <Card title="Frais annexes & bancaires" sub="Souvent sous-estimés.">
              <Field label="Frais de garantie" sub="Hypothèque ou caution">
                <Money v={d.fraisGarantie} on={set("fraisGarantie")} />
              </Field>
              <Field label="Frais de dossier bancaire">
                <Money v={d.fraisDossier} on={set("fraisDossier")} />
              </Field>
              <Field label="Frais de courtage">
                <Money v={d.fraisCourtage} on={set("fraisCourtage")} />
              </Field>
              <Field label="Chasseur immobilier" sub="Honoraires de recherche">
                <Money v={d.chasseur} on={set("chasseur")} />
              </Field>
              <Field label="Autres frais" sub="Diagnostics, déplacements…">
                <Money v={d.autresAchat} on={set("autresAchat")} />
              </Field>
              <div className="calc">
                <span className="lab">Total acquisition</span>
                <span className="val">
                  <span className="serif">{eur(m.totalAchat)}</span>
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* -------- onglet 2 : TRAVAUX & MOBILIER -------- */}
        {tab === 1 && (
          <div className="grid">
            <Card title="Travaux" sub="Rénovation et mise aux normes.">
              <Field label="Gros œuvre / structure">
                <Money v={d.grosOeuvre} on={set("grosOeuvre")} />
              </Field>
              <Field label="Plomberie / électricité">
                <Money v={d.plomberieElec} on={set("plomberieElec")} />
              </Field>
              <Field label="Cuisine">
                <Money v={d.cuisine} on={set("cuisine")} />
              </Field>
              <Field label="Salle(s) de bain">
                <Money v={d.sdb} on={set("sdb")} />
              </Field>
              <Field label="Sols, murs, peinture">
                <Money v={d.solsPeinture} on={set("solsPeinture")} />
              </Field>
              <Field label="Architecte / maître d'œuvre">
                <Money v={d.archi} on={set("archi")} />
              </Field>
              <Field label="Autres travaux">
                <Money v={d.autresTravaux} on={set("autresTravaux")} />
              </Field>
              <div className="calc">
                <span className="lab">Total travaux</span>
                <span className="val">
                  <span className="serif">{eur(m.totalTravaux)}</span>
                </span>
              </div>
            </Card>

            <Card
              title="Mobilier & équipement"
              sub="Indispensable en meublé de tourisme."
            >
              <Field label="Mobilier" sub="Lits, canapés, tables…">
                <Money v={d.mobilier} on={set("mobilier")} />
              </Field>
              <Field label="Électroménager">
                <Money v={d.electromenager} on={set("electromenager")} />
              </Field>
              <Field label="Literie & linge de maison" sub="Souvent en double jeu">
                <Money v={d.literie} on={set("literie")} />
              </Field>
              <Field label="Arts de la table" sub="Vaisselle, ustensiles">
                <Money v={d.artTable} on={set("artTable")} />
              </Field>
              <Field label="Décoration / home staging" sub="Photos = réservations">
                <Money v={d.deco} on={set("deco")} />
              </Field>
              <Field label="Aménagement extérieur" sub="Terrasse, jardin, spa…">
                <Money v={d.exterieur} on={set("exterieur")} />
              </Field>
              <Field label="Domotique" sub="Serrure connectée, box, TV">
                <Money v={d.domotique} on={set("domotique")} />
              </Field>
              <div className="calc">
                <span className="lab">Total mobilier & équipement</span>
                <span className="val">
                  <span className="serif">{eur(m.totalMobilier)}</span>
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* -------- onglet 3 : FINANCEMENT & LOCATION -------- */}
        {tab === 2 && (
          <>
            <div className="grid">
              <Card title="Financement" sub="Le prêt couvre le reste à financer.">
                <Field label="Apport personnel">
                  <Money v={d.apport} on={set("apport")} />
                </Field>
                <Field label="Montant à emprunter" sub="Coût du projet − apport">
                  <Money v={Math.round(m.emprunt)} on={() => {}} disabled />
                </Field>
                <Field label="Taux d'intérêt annuel">
                  <Money v={d.tauxInteret} on={set("tauxInteret")} suf="%" />
                </Field>
                <Field label="Durée du prêt">
                  <Money v={d.duree} on={set("duree")} suf="ans" />
                </Field>
                <Field label="Taux assurance emprunteur" sub="Sur capital initial">
                  <Money
                    v={d.tauxAssurance}
                    on={set("tauxAssurance")}
                    suf="%"
                  />
                </Field>
                <div className="calc">
                  <span className="lab">Mensualité (crédit + assurance)</span>
                  <span className="val">
                    <span className="serif">{eur(m.mensTot)}</span>
                  </span>
                </div>
              </Card>

              <Card title="Revenus locatifs" sub="Estimation à l'année.">
                <Field label="Prix moyen par nuit">
                  <Money v={d.prixNuit} on={set("prixNuit")} />
                </Field>
                <Field
                  label="Taux d'occupation"
                  sub={`Soit ${Math.round(m.nuits)} nuits / an`}
                >
                  <Money
                    v={d.tauxOccupation}
                    on={set("tauxOccupation")}
                    suf="%"
                  />
                </Field>
                <Field
                  label="Frais de plateforme"
                  sub="Commission Airbnb, Booking…"
                >
                  <Money
                    v={d.fraisPlateforme}
                    on={set("fraisPlateforme")}
                    suf="%"
                  />
                </Field>
                <div className="calc">
                  <span className="lab">Revenu brut annuel</span>
                  <span className="val">
                    <span className="serif">{eur(m.revenuBrut)}</span>
                  </span>
                </div>
                <div className="note">
                  <Info size={15} />
                  <span>
                    Le taux d'occupation intègre déjà la vacance locative
                    (saisonnalité, périodes creuses). La taxe de séjour est
                    collectée auprès du voyageur puis reversée : neutre pour
                    vous, elle n'apparaît pas dans les charges.
                  </span>
                </div>
              </Card>
            </div>

            <div className="grid" style={{ marginTop: 18 }}>
              <Card
                title="Charges d'exploitation annuelles"
                sub="Tout ce qui revient chaque année."
              >
                <Field
                  label="Conciergerie"
                  sub="Gestion complète, % des revenus"
                >
                  <Money v={d.conciergerie} on={set("conciergerie")} suf="%" />
                </Field>
                <Field label="Charges de copropriété">
                  <Money v={d.copropriete} on={set("copropriete")} />
                </Field>
                <Field label="Taxe foncière">
                  <Money v={d.taxeFonciere} on={set("taxeFonciere")} />
                </Field>
                <Field label="Assurance PNO" sub="Propriétaire non occupant">
                  <Money v={d.assurancePNO} on={set("assurancePNO")} />
                </Field>
                <Field label="CFE" sub="Cotisation foncière des entreprises">
                  <Money v={d.cfe} on={set("cfe")} />
                </Field>
                <Field label="Comptable" sub="Recommandé en régime réel">
                  <Money v={d.comptable} on={set("comptable")} />
                </Field>
              </Card>

              <Card title="Charges courantes & provisions" sub=" ">
                <Field label="Énergie" sub="Électricité, eau, chauffage">
                  <Money v={d.energie} on={set("energie")} />
                </Field>
                <Field label="Internet & abonnements" sub="Box, Netflix, ménage récurrent">
                  <Money v={d.internet} on={set("internet")} />
                </Field>
                <Field label="Entretien & petites réparations">
                  <Money v={d.entretien} on={set("entretien")} />
                </Field>
                <Field
                  label="Provision gros travaux"
                  sub="Mise de côté annuelle"
                >
                  <Money v={d.provisionTravaux} on={set("provisionTravaux")} />
                </Field>
                <Field label="Autres charges">
                  <Money v={d.autresCharges} on={set("autresCharges")} />
                </Field>
                <div className="calc">
                  <span className="lab">Total charges (avec conciergerie & plateforme)</span>
                  <span className="val">
                    <span className="serif">{eur(m.chargesExploit)}</span>
                  </span>
                </div>
              </Card>
            </div>

            <div className="grid" style={{ marginTop: 18 }}>
              <Card
                className="full"
                title="Fiscalité — estimation simplifiée (optionnelle)"
                sub="Pour une vision après impôt. À valider avec un expert-comptable."
              >
                <div className="toggle">
                  <input
                    type="checkbox"
                    id="fi"
                    checked={d.estimImpot}
                    onChange={(e) => setVal("estimImpot", e.target.checked)}
                  />
                  <label htmlFor="fi">Estimer l'impôt sur les loyers (BIC meublé)</label>
                </div>
                {d.estimImpot && (
                  <>
                    <Field label="Régime fiscal">
                      <div className="inwrap">
                        <select value={d.regime} onChange={set("regime")}>
                          <option value="micro">Micro-BIC (abattement)</option>
                          <option value="reel">Réel (résultat saisi)</option>
                        </select>
                      </div>
                    </Field>
                    {d.regime === "micro" ? (
                      <Field
                        label="Abattement forfaitaire"
                        sub="Selon classement & seuils (variables) — à vérifier"
                      >
                        <Money v={d.abattement} on={set("abattement")} suf="%" />
                      </Field>
                    ) : (
                      <Field
                        label="Résultat imposable estimé"
                        sub="Après amortissements — souvent proche de 0 € en LMNP réel"
                      >
                        <Money v={d.resultatReel} on={set("resultatReel")} />
                      </Field>
                    )}
                    <Field label="Tranche marginale d'imposition">
                      <Money v={d.tmi} on={set("tmi")} suf="%" />
                    </Field>
                    <Field label="Prélèvements sociaux">
                      <Money
                        v={d.prelevSociaux}
                        on={set("prelevSociaux")}
                        suf="%"
                      />
                    </Field>
                    <div className="calc">
                      <span className="lab">Impôt estimé / an</span>
                      <span className="val">
                        <span className="serif">{eur(m.impot)}</span>
                      </span>
                    </div>
                  </>
                )}
                <div className="note">
                  <Info size={15} />
                  <span>
                    Les seuils, abattements et avantages du LMNP évoluent
                    régulièrement (lois de finances). Cette estimation reste
                    indicative : faites-la confirmer par un professionnel.
                  </span>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* -------- onglet 4 : SYNTHÈSE -------- */}
        {tab === 3 && (
          <Synthese m={m} d={d} cfMois={cfMois} />
        )}
      </div>
    </div>
  );
}

/* ---------------------- composants ---------------------- */
function Card({ title, sub, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      <h3>{title}</h3>
      {sub && <p className="sub">{sub}</p>}
      {children}
    </section>
  );
}

function Field({ label, sub, children }) {
  return (
    <div className="fld">
      <div className="lab">
        {label}
        {sub && <small>{sub}</small>}
      </div>
      {children}
    </div>
  );
}

function Money({ v, on, suf = "€", disabled = false }) {
  return (
    <div className={`inwrap ${suf === "%" ? "pct" : ""}`}>
      <input
        type="text"
        inputMode="decimal"
        value={v === 0 ? "0" : v ?? ""}
        onChange={on}
        disabled={disabled}
        placeholder="0"
        onWheel={(e) => e.currentTarget.blur()}
      />
      <span className="suf">{suf}</span>
    </div>
  );
}

function Synthese({ m, d, cfMois }) {
  const positif = cfMois >= 0;
  // barre de répartition du revenu brut
  const base = Math.max(m.revenuBrut, m.chargesExploit + m.annuelCredit, 1);
  const seg = (n) => `${Math.max(0, (n / base) * 100)}%`;
  const reste = m.cashflowAvImpot;

  return (
    <>
      <div className={`verdict ${positif ? "pos" : "neg"}`}>
        {positif ? <TrendingUp size={26} /> : <TrendingDown size={26} />}
        <span>
          {positif ? (
            <>
              Projet auto-financé : il dégage{" "}
              <span className="big">{eur(cfMois)} / mois</span> de cash-flow
              après crédit{d.estimImpot ? " et impôt" : ""}.
            </>
          ) : (
            <>
              Effort d'épargne de{" "}
              <span className="big">{eur(Math.abs(cfMois))} / mois</span> à
              prévoir pour combler le déficit.
            </>
          )}
        </span>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="k">Rentabilité brute</div>
          <div className="v">{pct(m.rentaBrute)}</div>
          <div className="foot">Revenu brut / coût total</div>
        </div>
        <div className="kpi">
          <div className="k">Rentabilité nette</div>
          <div className="v">{pct(m.rentaNette)}</div>
          <div className="foot">Après charges, avant crédit</div>
        </div>
        <div className="kpi">
          <div className="k">Cash-flow annuel</div>
          <div className={`v ${m.cashflowApImpot >= 0 ? "pos" : "neg"}`}>
            {eur(m.cashflowApImpot)}
          </div>
          <div className="foot">{d.estimImpot ? "Après impôt" : "Avant impôt"}</div>
        </div>
        <div className="kpi">
          <div className="k">Rendement sur apport</div>
          <div className={`v ${m.cashOnCash >= 0 ? "pos" : "neg"}`}>
            {m.apport > 0 ? pct(m.cashOnCash) : "—"}
          </div>
          <div className="foot">Cash-flow / apport</div>
        </div>
      </div>

      <div className="grid">
        <Card title="Investissement de départ" sub="Ce qu'il faut sortir.">
          <table className="ledger">
            <tbody>
              <tr>
                <td>Acquisition</td>
                <td>{eur(m.totalAchat)}</td>
              </tr>
              <tr>
                <td>Travaux</td>
                <td>{eur(m.totalTravaux)}</td>
              </tr>
              <tr>
                <td>Mobilier & équipement</td>
                <td>{eur(m.totalMobilier)}</td>
              </tr>
              <tr className="tot">
                <td>Coût total du projet</td>
                <td>{eur(m.coutProjet)}</td>
              </tr>
              <tr className="sub">
                <td>dont apport</td>
                <td>{eur(m.apport)}</td>
              </tr>
              <tr className="sub">
                <td>dont emprunt</td>
                <td>{eur(m.emprunt)}</td>
              </tr>
              <tr className="sub">
                <td>Coût total du crédit (intérêts + assurance)</td>
                <td>{eur(m.coutCredit)}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card title="Exploitation annuelle" sub="Une année type.">
          <table className="ledger">
            <tbody>
              <tr>
                <td>Revenu brut locatif</td>
                <td className="pos">{eur(m.revenuBrut)}</td>
              </tr>
              <tr className="sub">
                <td>Conciergerie + plateforme</td>
                <td className="neg">
                  −{eur(m.conciergerieEur + m.plateformeEur)}
                </td>
              </tr>
              <tr className="sub">
                <td>Autres charges</td>
                <td className="neg">
                  −{eur(m.chargesExploit - m.conciergerieEur - m.plateformeEur)}
                </td>
              </tr>
              <tr>
                <td>Mensualités de crédit</td>
                <td className="neg">−{eur(m.annuelCredit)}</td>
              </tr>
              {d.estimImpot && (
                <tr>
                  <td>Impôt estimé</td>
                  <td className="neg">−{eur(m.impot)}</td>
                </tr>
              )}
              <tr className="tot">
                <td>Cash-flow net</td>
                <td className={m.cashflowApImpot >= 0 ? "pos" : "neg"}>
                  {eur(m.cashflowApImpot)}
                </td>
              </tr>
            </tbody>
          </table>

          <div
            className="bar"
            role="img"
            aria-label="Répartition du revenu brut"
          >
            <span
              style={{
                width: seg(m.conciergerieEur + m.plateformeEur),
                background: "#C99A3E",
              }}
            />
            <span
              style={{
                width: seg(
                  m.chargesExploit - m.conciergerieEur - m.plateformeEur
                ),
                background: "#8FA7BC",
              }}
            />
            <span
              style={{ width: seg(m.annuelCredit), background: "#15283B" }}
            />
            <span
              style={{
                width: seg(Math.max(0, reste)),
                background: reste >= 0 ? "#1C7A52" : "#B23B2E",
              }}
            />
          </div>
          <div className="legend">
            <span>
              <i style={{ background: "#C99A3E" }} />
              Conciergerie & plateforme
            </span>
            <span>
              <i style={{ background: "#8FA7BC" }} />
              Charges
            </span>
            <span>
              <i style={{ background: "#15283B" }} />
              Crédit
            </span>
            <span>
              <i style={{ background: reste >= 0 ? "#1C7A52" : "#B23B2E" }} />
              {reste >= 0 ? "Reste" : "Déficit"}
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}
