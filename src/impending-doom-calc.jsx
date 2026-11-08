import { useState, useMemo } from "react";
import "./impending-doom-calc.css";

function Prompt({ children }) {
  return (
    <p className="line">
      <span className="prompt">fezalion@impendingdoom</span>
      <span className="dim">:</span>
      <span className="path">~</span>
      <span className="dim">$</span> {children}
    </p>
  );
}

// ─── Shared constants ────────────────────────────────────────────────────────
const TICKS_PER_SEC = 30;
const TEMP_CHAINS_BASE = 0.5; // base cast time of Temporal Chains (constant)

// ─── Tab 1 helpers ───────────────────────────────────────────────────────────
function calcCDRRow(
  cdr,
  vixenCD,
  doomCD,
  tempChains,
  actionSpeed,
  cascadeHits,
) {
  const cdrDiv = 1 + cdr / 100;
  const vixenEffCD = vixenCD / cdrDiv;
  const doomEffCD = doomCD / cdrDiv;
  const vixenTicks = Math.ceil(vixenEffCD * TICKS_PER_SEC);
  const vixenCDRSec = vixenTicks / TICKS_PER_SEC;
  const asMult = 1 + actionSpeed / 100;
  const maxDpsCS = Math.floor(
    (1 / (cascadeHits * doomEffCD * asMult) - 1) * 100,
  );
  const hardcapCS = Math.floor(
    (7.5 / (vixenTicks * (1 - tempChains) * asMult) - 1) * 100,
  );
  return {
    cdr,
    maxDpsCS: Math.max(0, maxDpsCS),
    hardcapCS: Math.max(0, hardcapCS),
    vixenTicks,
    vixenCDRSec: +vixenCDRSec.toFixed(3),
    doomEffCD: +doomEffCD.toFixed(3),
  };
}

// ─── Tab 2 helpers ───────────────────────────────────────────────────────────
function calcSpecific(
  cdr,
  castSpeedPct,
  actionSpeed,
  tempChainsBase,
  vixenCD,
  doomCD,
) {
  const cdrDiv = 1 + cdr / 100;
  const vixenEff = vixenCD / cdrDiv;
  const doomEff = doomCD / cdrDiv;
  const vixenTicks = Math.ceil(vixenEff * TICKS_PER_SEC);
  const vixenServerCD = vixenTicks / TICKS_PER_SEC;
  const asMult = 1 + actionSpeed / 100;
  const castTime = tempChainsBase / (1 + castSpeedPct / 100) / asMult;
  const vixenWasted = castTime - vixenServerCD;
  const blastRatio = castTime / doomEff;
  const blastWasted = (blastRatio % 1) * doomEff;
  return {
    castTime,
    vixenWasted,
    blastWasted,
    vixenServerCD,
    doomEff,
    vixenTicks,
  };
}

// ─── Tab 1: CDR Table ─────────────────────────────────────────────────────────
function CDRTable({
  vixenCD,
  setVixenCD,
  doomCD,
  setDoomCD,
  actionSpeed,
  setActionSpeed,
  awakened,
  setAwakened,
}) {
  const [highlightCDR, setHighlightCDR] = useState("");
  const cascadeHits = awakened ? 5 : 4;

  const rows = useMemo(() => {
    const data = [];
    for (let cdr = 0; cdr <= 89; cdr++) {
      data.push(
        calcCDRRow(
          cdr,
          vixenCD,
          doomCD,
          TEMP_CHAINS_BASE,
          actionSpeed,
          cascadeHits,
        ),
      );
    }
    return data;
  }, [vixenCD, doomCD, actionSpeed, cascadeHits]);

  const breakpoints = useMemo(() => {
    const bp = new Set();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].vixenTicks !== rows[i - 1].vixenTicks) bp.add(rows[i].cdr);
    }
    return bp;
  }, [rows]);

  const hlCDR = parseInt(highlightCDR);
  const hlRow = !isNaN(hlCDR) && hlCDR >= 0 && hlCDR <= 89 ? rows[hlCDR] : null;

  return (
    <div className="layout">
      <div>
        <div className="panel">
          <div className="panel-title">Parameters</div>
          <span className="toggle-label">Spell Cascade</span>
          <div className="toggle-group">
            <button
              className={`toggle-btn${!awakened ? " active" : ""}`}
              onClick={() => setAwakened(false)}
            >
              Regular
            </button>
            <button
              className={`toggle-btn${awakened ? " active" : ""}`}
              onClick={() => setAwakened(true)}
            >
              Greater
            </button>
          </div>

          <div className="field">
            <div className="hint">
              The Greater selection is WIP and not tested{" "}
              <span className="bad">DO NOT RELY</span> on it.
            </div>
          </div>

          <div className="field">
            <label>Vixen Cooldown (s)</label>
            <input
              type="number"
              step="0.01"
              value={vixenCD}
              onChange={(e) => setVixenCD(parseFloat(e.target.value) || 0.25)}
            />
          </div>
          <div className="field">
            <label>Doom Blast Cooldown (s)</label>
            <input
              type="number"
              step="0.01"
              value={doomCD}
              onChange={(e) => setDoomCD(parseFloat(e.target.value) || 0.15)}
            />
          </div>
          <div className="field">
            <label>Action Speed (%)</label>
            <input
              type="number"
              step="1"
              value={actionSpeed}
              onChange={(e) => setActionSpeed(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {hlRow && (
          <div className="panel" style={{ marginTop: "1rem" }}>
            <div className="panel-title">CDR {hlCDR}% Results</div>
            <div className="info-boxes">
              <div className="info-box">
                <div className="ib-label">Max DPS Cast Speed</div>
                <div className="ib-value">{hlRow.maxDpsCS}%</div>
              </div>
              <div className="info-box danger">
                <div className="ib-label">Hardcap Cast Speed</div>
                <div className="ib-value">{hlRow.hardcapCS}%</div>
              </div>
              <div className="info-box">
                <div className="ib-label">Vixen Ticks</div>
                <div className="ib-value">{hlRow.vixenTicks}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="search-row">
          <label>Jump to CDR %:</label>
          <input
            type="number"
            min="0"
            max="89"
            placeholder="e.g. 30"
            value={highlightCDR}
            onChange={(e) => setHighlightCDR(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>CDR %</th>
                <th>Max DPS CS</th>
                <th>Hardcap CS</th>
                <th>Vixen Ticks</th>
                <th>Vixen CD</th>
                <th>Doom CD</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.cdr}
                  className={[
                    row.cdr === hlCDR ? "highlight-row" : "",
                    breakpoints.has(row.cdr) ? "breakpoint-row" : "",
                  ].join(" ")}
                >
                  <td>
                    {row.cdr}
                    {breakpoints.has(row.cdr) && (
                      <span className="badge badge-bp">bp</span>
                    )}
                  </td>
                  <td className="val-maxdps">{row.maxDpsCS}</td>
                  <td className="val-hardcap">{row.hardcapCS}</td>
                  <td className="val-ticks">{row.vixenTicks}</td>
                  <td>{row.vixenCDRSec.toFixed(3)}</td>
                  <td>{row.doomEffCD.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Checking Specific Values ─────────────────────────────────────────
function SpecificValues({ vixenCD, doomCD }) {
  const [cdr, setCdr] = useState(53);
  const [actionSpeed, setAS] = useState(0);
  const [myCastSpeed, setMyCS] = useState(133);
  const [offset, setOffset] = useState(10);

  const tempChainsBase = TEMP_CHAINS_BASE;

  const summary = useMemo(
    () =>
      calcSpecific(
        cdr,
        myCastSpeed,
        actionSpeed,
        tempChainsBase,
        vixenCD,
        doomCD,
      ),
    [cdr, myCastSpeed, actionSpeed, tempChainsBase, vixenCD, doomCD],
  );

  const clampedOffset = Math.min(15, Math.max(0, offset));
  const tableRows = useMemo(() => {
    const lo = myCastSpeed - clampedOffset;
    const hi = myCastSpeed + clampedOffset;
    const rows = [];
    for (let cs = lo; cs <= hi; cs++) {
      rows.push({
        cs,
        ...calcSpecific(cdr, cs, actionSpeed, tempChainsBase, vixenCD, doomCD),
      });
    }
    return rows;
  }, [
    cdr,
    myCastSpeed,
    clampedOffset,
    actionSpeed,
    tempChainsBase,
    vixenCD,
    doomCD,
  ]);

  function wastedClass(v, type) {
    if (type === "vixen") {
      if (v < 0) return "wasted-loss"; // casting too slow, losing DPS
      if (v < 0.005) return "wasted-good";
      if (v < 0.02) return "wasted-ok";
      return "wasted-bad";
    }
    // blast
    if (v < 0.005) return "wasted-good";
    if (v < 0.015) return "wasted-ok";
    return "wasted-bad";
  }

  function vixenSummaryClass(v) {
    if (v < 0) return "loss";
    if (v < 0.005) return "good";
    if (v < 0.02) return "warn";
    return "danger";
  }
  function blastSummaryClass(v) {
    if (v < 0.005) return "good";
    if (v < 0.015) return "warn";
    return "danger";
  }

  const vixenEff = vixenCD / (1 + cdr / 100);
  const doomEffDisp = doomCD / (1 + cdr / 100);

  return (
    <div className="spec-layout">
      <div>
        <div className="panel">
          <div className="panel-title">Your Stats</div>
          <div className="field">
            <label>CDR %</label>
            <input
              type="number"
              min="0"
              max="89"
              value={cdr}
              onChange={(e) =>
                setCdr(Math.max(0, Math.min(89, parseInt(e.target.value) || 0)))
              }
            />
          </div>
          <div className="field">
            <label>Action Speed (%)</label>
            <input
              type="number"
              step="1"
              value={actionSpeed}
              onChange={(e) => setAS(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="field">
            <label>Your Cast Speed (%)</label>
            <input
              type="number"
              step="1"
              value={myCastSpeed}
              onChange={(e) => setMyCS(parseInt(e.target.value) || 0)}
            />
            <div className="hint">
              The increased cast speed value you currently have
            </div>
          </div>

          <div style={{ marginTop: "1rem", marginBottom: "0.4rem" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Scan Offset (±, max 15)</label>
              <input
                type="number"
                min="0"
                max="15"
                value={offset}
                onChange={(e) =>
                  setOffset(
                    Math.min(15, Math.max(0, parseInt(e.target.value) || 0)),
                  )
                }
              />
              <div className="hint">
                Shows your CS ± this value. You will always be in the middle.
              </div>
            </div>
          </div>

          <div className="derived-grid">
            <div className="derived-box">
              <div className="db-label">Vixen Eff CD</div>
              <div className="db-value">{vixenEff.toFixed(4)}s</div>
            </div>
            <div className="derived-box">
              <div className="db-label">Vixen Ticks</div>
              <div className="db-value">{summary.vixenTicks}</div>
            </div>
            <div className="derived-box">
              <div className="db-label">Server Tick</div>
              <div className="db-value">
                {summary.vixenServerCD.toFixed(3)}s
              </div>
            </div>
            <div className="derived-box">
              <div className="db-label">Doom Eff CD</div>
              <div className="db-value">{doomEffDisp.toFixed(4)}s</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="spec-summary">
          <div className="spec-summary-title">
            Results at {myCastSpeed}% Cast Speed
          </div>
          <div className="spec-summary-grid">
            <div className="ssb neutral">
              <div className="ssb-label">Cast Time</div>
              <div className="ssb-value">{summary.castTime.toFixed(4)}s</div>
            </div>
            <div className="ssb neutral">
              <div className="ssb-label">Base Cast Time</div>
              <div className="ssb-value">{tempChainsBase.toFixed(2)}s</div>
            </div>
            <div className={`ssb ${vixenSummaryClass(summary.vixenWasted)}`}>
              <div className="ssb-label">Vixen CD Wasted</div>
              <div className="ssb-value">
                {summary.vixenWasted < 0 ? "−" : "+"}
                {Math.abs(summary.vixenWasted).toFixed(4)}s
              </div>
            </div>
            <div className={`ssb ${blastSummaryClass(summary.blastWasted)}`}>
              <div className="ssb-label">Blast CD Wasted</div>
              <div className="ssb-value">{summary.blastWasted.toFixed(4)}s</div>
            </div>
          </div>
        </div>

        <div className="hint-banner">
          <span>Vixen Wasted:</span> difference between your cast time and
          Vixen's server-tick window.
          <span> Negative (purple) = casting too slowly, losing DPS.</span>{" "}
          Positive value closest to 0 is ideal.
          <br />
          <span>Blast Wasted:</span> how much of Doom Blast's cooldown is wasted
          per cast — lower is better.
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>CS %</th>
                <th>Cast Time</th>
                <th>Vixen Wasted</th>
                <th>Blast Wasted</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr
                  key={row.cs}
                  className={row.cs === myCastSpeed ? "current-cs-row" : ""}
                >
                  <td>
                    {row.cs}
                    {row.cs === myCastSpeed && (
                      <span className="badge badge-you">you</span>
                    )}
                  </td>
                  <td>{row.castTime.toFixed(4)}</td>
                  <td className={wastedClass(row.vixenWasted, "vixen")}>
                    {row.vixenWasted < 0 ? "−" : "+"}
                    {Math.abs(row.vixenWasted).toFixed(4)}
                  </td>
                  <td className={wastedClass(row.blastWasted, "blast")}>
                    {row.blastWasted.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ Tab ──────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Why does Doom Blast have a Cast Speed Hardcap — and what happens if I exceed it?",
    a: (
      <>
        <p>
          Doom Blast is triggered by <strong>Vixen's Entrapment</strong>{" "}
          whenever a hex is overwritten past your curse limit. Vixen's has its
          own cooldown (default <span className="code-inline">0.25s</span>,
          reduced by CDR), which is snapped to the nearest server tick at{" "}
          <strong>30 ticks/sec</strong>. That snapping creates a precise window:
          you must cast Temporal Chains <em>at most</em> once per Vixen tick.
        </p>
        <p>
          If your cast speed is so high that you cast <em>twice</em> before
          Vixen's cooldown expires, the second cast fires a second Vixen proc —
          but Doom Blast's own <span className="code-inline">0.15s</span>{" "}
          cooldown isn't ready yet, so that trigger is{" "}
          <span className="danger-text">wasted</span>. You end up with the same
          number of Doom Blasts per second as before, but spending twice the
          casts — effectively{" "}
          <span className="danger-text">halving your DPS</span>.
        </p>
        <p>
          The <span className="highlight">Hardcap CS</span> column in the CDR
          table shows the maximum cast speed (in % increased) you should ever
          have, including temporary buffs like Onslaught or Frenzy charges. Stay
          below it at all times.
        </p>
      </>
    ),
  },
  {
    q: "What is the difference between Max DPS Cast Speed and the Hardcap?",
    a: (
      <>
        <p>
          These are two separate ceilings and it's important not to confuse
          them:
        </p>
        <ul>
          <li>
            <strong>Max DPS Cast Speed</strong> — the point at which your cast
            rate matches Doom Blast's effective cooldown multiplied by cascade
            hits. Going faster than this does not add any additional Doom Blasts
            per second; you're already firing one per available cooldown window.
            This is your <span className="highlight">bossing target</span>.
          </li>
          <li>
            <strong>Cast Speed Hardcap</strong> — the absolute ceiling beyond
            which you actively break the interaction and lose DPS. This is
            determined by Vixen's server-tick window and is always higher than
            Max DPS CS.{" "}
            <span className="danger-text">
              Never exceed this, even with temporary buffs.
            </span>
          </li>
        </ul>
        <p>
          In practice you want your cast speed to sit near or just under Max DPS
          CS during bossing, with enough headroom that mapping buffs (Onslaught,
          Adrenaline, etc.) don't push you past the Hardcap.
        </p>
      </>
    ),
  },
  {
    q: "Do CDR breakpoints matter for Doom Blast like they do for other trigger skills?",
    a: (
      <>
        <p>
          <strong>For Doom Blast itself — no.</strong> Most trigger skills (Cast
          on Crit, CWDT) must wait for their cooldown to snap to the next server
          tick, creating meaningful CDR thresholds. Doom Blast stores up to{" "}
          <span className="code-inline">3 charges</span> that recover on a
          rolling basis, so its cooldown scales continuously with CDR. Any CDR%
          you add directly reduces the effective cooldown — there are no wasted
          breakpoints on Doom Blast.
        </p>
        <p>
          <strong>For Vixen's Entrapment — yes, one matters.</strong> Vixen's
          cooldown <em>does</em> snap to server ticks. The only practically
          significant breakpoint is around{" "}
          <span className="highlight">80–88% CDR</span>, where Vixen's ticks
          drop from 5 to 4 (visible as a <span className="code-inline">bp</span>{" "}
          marker in the CDR table). This slightly shifts both the Max DPS and
          Hardcap cast speed thresholds, so it's worth noting if you're near
          that range.
        </p>
        <p>
          Below ~80% CDR, Vixen's sits at 5 ticks and all other CDR is
          effectively smooth scaling. Focus your CDR investment on lowering Doom
          Blast's raw cooldown — every percent counts.
        </p>
      </>
    ),
  },
  {
    q: "My first cast does not damage enemies?",
    a: (
      <>
        <p>
          <strong>You’re slightly short on cast speed.</strong> What’s happening
          is that your first Vixen’s curse is applying <em>before</em> your
          Impending Doom curse. Because of that ordering, your main curse
          doesn’t get overridden on the first cast, which disrupts the expected
          Doom trigger sequence.
        </p>
        <p>
          The simplest fix is to increase your cast speed so the timing lines up
          correctly. Socketing a{" "}
          <span className="code-inline">Faster Casting Support</span> is usually
          enough to solve the issue and stabilize the curse order.
        </p>
      </>
    ),
  },
  {
    q: "My first cast How should I socket my curses, what should my main curse be? not damage enemies?",
    a: (
      <>
        <p>
          <strong>There’s an active curse cycle at play.</strong> For clarity,
          let’s define terms: your self-cast curse is the{" "}
          <span className="highlight">main curse</span>, and the Vixen’s curses
          are <span className="code-inline">Curse 1</span>,{" "}
          <span className="code-inline">Curse 2</span>, and{" "}
          <span className="code-inline">Curse 3</span>, ordered clockwise in the
          gem links.
        </p>
        <p>
          The main curse and Curse 1 effectively “ping-pong” between each other.
          First, your main curse applies. Then Curse 1, 2, and 3 trigger. Curse
          3 ends up removing your main curse. When you cast again, your main
          curse replaces the <em>oldest</em> curse in the chain — which is Curse
          1.
        </p>
        <p>
          <strong>Practical takeaway:</strong> curses placed in slots 2 and 3
          maintain 100% uptime in the rotation. If you want a curse to linger
          after you stop casting, it should be your main curse or placed in
          slots 2 and 3.
        </p>
        <p>
          For maximum damage, placing{" "}
          <span className="code-inline">Despair</span> and{" "}
          <span className="code-inline">Temporal Chains</span> in slots 2 and 3
          is ideal. Then use <span className="code-inline">Enfeeble</span> as
          your main curse so its defensive effect lingers when you stop
          attacking.
        </p>
      </>
    ),
  },
];

function Accordion({ item, isOpen, onToggle }) {
  return (
    <div className={`accordion${isOpen ? " open" : ""}`}>
      <button
        className="accordion-trigger"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="accordion-question">{item.q}</span>
        <span className="accordion-chevron" aria-hidden="true">
          {isOpen ? "[−]" : "[+]"}
        </span>
      </button>
      <div className="accordion-body">
        <div className="accordion-divider" />
        {item.a}
      </div>
    </div>
  );
}

// ─── Loadout data ──────────────────────────────────
const LOADOUT_DATA = {
  poison: {
    label: "Poison",
    variants: {
      early: {
        tabLabel: "Leveling (39-70)",
        title: "Leveling Setup (39-70)",
        helm: {
          name: "Foulborn Doedre's Scorn",
          gems: [
            { name: "Utility Curse", role: "Main", color: "any" },
            { name: "Chance to Pois.", role: "Support", color: "green" },
            { name: "Void Manip.", role: "Support", color: "green" },
            { name: "Cruelty", role: "Support", color: "red" },
          ],
          note: "Main Curse: Use any curse EXCEPT Temp. Chains, Enfeeble or Despair,",
        },
        gloves: {
          name: "Vixen's Entrapment",
          gems: [
            { name: "Temp. Chains", role: "Curse 1", color: "green" },
            { name: "Enfeeble", role: "Curse 2", color: "blue" },
            { name: "Spell Cascade", role: "Support", color: "blue" },
            { name: "Despair", role: "Curse 3", color: "blue" },
          ],
        },
      },
      late: {
        tabLabel: "Mid-Game (70+)",
        title: "Mid-Game Setup (70+)",
        helm: {
          name: "Foulborn Doedre's Scorn | Level 35 Impending Doom Shako",
          gems: [
            { name: "Temp. Chains", role: "Main", color: "green" },
            { name: "Deadly Ailm.", role: "Support", color: "green" },
            { name: "Spell Cascade", role: "Support", color: "blue" },
            { name: "Unbound Ailm.", role: "Support", color: "blue" },
          ],
          note: "Primary poison scaling setup for high level mapping.",
        },
        gloves: {
          name: "Vixen's Entrapment",
          gems: [
            { name: "Utility Curse", role: "Filler", color: "any" },
            { name: "Enfeeble", role: "Curse 2", color: "blue" },
            { name: "Despair", role: "Curse 3", color: "blue" },
            { name: "Spell Cascade", role: "Support", color: "blue" },
          ],
          note: "Filler Curse: Any curse that won't be in use (Dead Curse).",
        },
      },
    },
  },
  ignite: {
    label: "Ignite",
    variants: {
      early: {
        tabLabel: "Leveling (39-70)",
        title: "Leveling Setup (39-70)",
        helm: {
          name: "Foulborn Doedre's Scorn",
          gems: [
            { name: "Utility Curse", role: "Main", color: "any" },
            { name: "Cruelty", role: "Support", color: "red" },
            { name: "Ignite Prolif.", role: "Support", color: "blue" },
            { name: "Combustion", role: "Support", color: "blue" },
          ],
          note: "Main Curse: Use any curse EXCEPT Enfeeble, Flammability, or Ele. Weakness.",
        },
        gloves: {
          name: "Vixen's Entrapment",
          gems: [
            { name: "Enfeeble", role: "Curse 1", color: "blue" },
            { name: "Flammability", role: "Curse 2", color: "red" },
            { name: "Ele. Weakness", role: "Curse 3", color: "blue" },
            { name: "Spell Cascade", role: "Support", color: "blue" },
          ],
        },
      },
      late: {
        tabLabel: "Mid-Game (70+)",
        title: "Mid-Game Setup (70+)",
        helm: {
          name: "Foulborn Doedre's Scorn | Level 35 Impending Doom Shako",
          gems: [
            { name: "Utility Curse", role: "Main", color: "any" },
            { name: "Burning Damage", role: "Support", color: "red" },
            { name: "Deadly Ailments", role: "Support", color: "green" },
            { name: "Ignite Prolif.", role: "Support", color: "blue" },
          ],
          note: "Main Curse: Use any curse EXCEPT Enfeeble, Flammability, or Ele. Weakness.",
        },
        gloves: {
          name: "Vixen's Entrapment",
          gems: [
            { name: "Enfeeble", role: "Curse 1", color: "blue" },
            { name: "Flammability", role: "Curse 2", color: "red" },
            { name: "Ele. Weakness", role: "Curse 3", color: "blue" },
            { name: "Spell Cascade", role: "Support", color: "blue" },
          ],
        },
      },
      endgame: {
        tabLabel: "Endgame",
        title: "Endgame (Fan the Flames Cluster)",
        helm: {
          name: "Foulborn Doedre's Scorn | Level 35 Impending Doom Shako",
          gems: [
            { name: "Utility Curse", role: "Main", color: "any" },
            { name: "Burning Damage", role: "Support", color: "red" },
            { name: "Deadly Ailments", role: "Support", color: "green" },
            { name: "Unbound Ailm.", role: "Support", color: "blue" },
          ],
          note: "Requires Fan the Flames Medium Cluster. Replace Ignite Proliferation with Unbound Ailments.",
        },
        gloves: {
          name: "Vixen's Entrapment",
          gems: [
            { name: "Enfeeble", role: "Curse 1", color: "blue" },
            { name: "Flammability", role: "Curse 2", color: "red" },
            { name: "Ele. Weakness", role: "Curse 3", color: "blue" },
            { name: "Spell Cascade", role: "Support", color: "blue" },
          ],
        },
      },
    },
  },
};

const GEM_CHARS = { red: "R", green: "G", blue: "B", white: "W", any: "A" };

function ItemCard({ slot, data }) {
  const subtitle = slot === "helm" ? "Helmet · 4-linked" : "Gloves · 4-linked";
  return (
    <section className="panel item">
      <div className="item-head">
        <h3 className="item-name">{data.name}</h3>
        <span className="dim">{subtitle}</span>
      </div>

      <div className="gems">
        {data.gems.map((gem, i) => (
          <div key={i} className={`gem c-${gem.color}`}>
            {i < data.gems.length - 1 && <span className="gem-link" />}
            <span className="socket">{GEM_CHARS[gem.color]}</span>
            <span className="gem-name">{gem.name}</span>
            <span className="gem-role dim">{gem.role}</span>
          </div>
        ))}
      </div>

      {data.note && <p className="item-note">{data.note}</p>}
    </section>
  );
}

function LoadoutsSection() {
  const [mainType, setMainType] = useState("poison");
  const [variant, setVariant] = useState("early");

  const archetype = LOADOUT_DATA[mainType];
  const activeVariant =
    archetype.variants[variant] || archetype.variants["early"];

  const handleArchetypeChange = (type) => {
    setMainType(type);
    setVariant("early");
  };

  return (
    <div className="loadouts">
      <Prompt>ls loadouts/</Prompt>

      <div className="tabs" role="tablist">
        {Object.keys(LOADOUT_DATA).map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={mainType === type}
            className="tab"
            onClick={() => handleArchetypeChange(type)}
          >
            {LOADOUT_DATA[type].label}
          </button>
        ))}
      </div>

      <div className="variant-group">
        {Object.keys(archetype.variants).map((vKey) => (
          <button
            key={vKey}
            type="button"
            className={`variant-pill${variant === vKey ? " active" : ""}`}
            onClick={() => setVariant(vKey)}
          >
            {archetype.variants[vKey].tabLabel}
          </button>
        ))}
      </div>

      <div className="loadout-card">
        <h3 className="loadout-title">{activeVariant.title}</h3>
        <ItemCard slot="helm" data={activeVariant.helm} />
        <ItemCard slot="gloves" data={activeVariant.gloves} />
      </div>
    </div>
  );
}

function FAQTab() {
  const [openIndex, setOpenIndex] = useState(null);
  function toggle(i) {
    setOpenIndex(openIndex === i ? null : i);
  }
  return (
    <>
      <div className="faq-wrap">
        <div className="faq-intro">
          <p>
            Common questions about the Impending Doom interaction, cast speed
            limits, and how CDR affects your trigger rate. Click any question to
            expand it.
          </p>
        </div>
        {FAQ_ITEMS.map((item, i) => (
          <Accordion
            key={i}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
      <LoadoutsSection />
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "faq", label: "faq" },
  { key: "cdr", label: "cdr & cast speed" },
  { key: "specific", label: "checking specific values" },
];

export default function ImpendingDoomCalc() {
  const [activeTab, setActiveTab] = useState("faq");

  // CDR tab params (the specific-values tab reuses the cooldowns)
  const [vixenCD, setVixenCD] = useState(0.25);
  const [doomCD, setDoomCD] = useState(0.15);
  const [actionSpeed, setActionSpeed] = useState(0);
  const [awakened, setAwakened] = useState(false);

  return (
    <main className="terminal">
      <div className="titlebar">
        <div className="dots">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
        <span className="title-text">fezalion@impendingdoom: ~</span>
        <a className="titlebar-link" href="https://fezalion.xyz">
          ← fezalion.xyz
        </a>
      </div>

      <div className="screen">
        <Prompt>cat impending-doom.txt</Prompt>
        <h1 className="title">Impending Doom</h1>
        <p className="line dim" style={{ marginBottom: 20 }}>
          Cast Speed &amp; CDR Calculator
        </p>

        <div className="tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className="tab"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div key={activeTab}>
          {activeTab === "faq" && <FAQTab />}

          {activeTab === "cdr" && (
            <>
              <div className="notes">
                <div className="note-card">
                  <h4>Cast Speed MaxDPS</h4>
                  <p>
                    The cast speed to aim for in bossing (no mapping buffs).
                    Getting more beyond this gives no DPS gain.
                  </p>
                </div>
                <div className="note-card">
                  <h4>Cast Speed Hardcap [!]</h4>
                  <p>
                    Do NOT exceed this at any point — including with Onslaught
                    or other temporary buffs. Exceeding it causes Doom Blast to
                    fire faster than Vixen's cooldown, halving your damage.
                  </p>
                </div>
                <div className="note-card">
                  <h4>Breakpoints</h4>
                  <p>
                    No real breakpoints except 80–88% CDR where Vixen Ticks
                    drop 5→4. Breakpoints elsewhere are a myth — Doom Blast's
                    cooldown recovers between server ticks.
                  </p>
                </div>
              </div>
              <CDRTable
                vixenCD={vixenCD}
                setVixenCD={setVixenCD}
                doomCD={doomCD}
                setDoomCD={setDoomCD}
                actionSpeed={actionSpeed}
                setActionSpeed={setActionSpeed}
                awakened={awakened}
                setAwakened={setAwakened}
              />
            </>
          )}

          {activeTab === "specific" && (
            <SpecificValues vixenCD={vixenCD} doomCD={doomCD} />
          )}
        </div>
      </div>

      <footer className="statusbar">
        <span>Originally made by @Silenth</span>
        <span className="sep">|</span>
        <a
          href="https://docs.google.com/spreadsheets/d/1J-yVLmDhKqKNE8QecsPnZgNR2TDGDm41f-1tdC_BxQA/edit?gid=1230763965#gid=1230763965"
          target="_blank"
          rel="noopener noreferrer"
        >
          og document
        </a>
        <span className="sep">|</span>
        <span>Website made by Fezalion</span>
      </footer>
    </main>
  );
}