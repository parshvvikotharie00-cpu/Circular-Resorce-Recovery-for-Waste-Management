let intelChart, compareChart, map, mapLayer;
const D=window.CRI_DATA;
const $=id=>document.getElementById(id);
const sectorLabel={agriculture:"Agricultural Biomass",plastic:"Plastic Waste",ewaste:"E-Waste"};
const REGION_COORDS={"Punjab":[31.1471,75.3412],"Maharashtra":[19.7515,75.7139],"Uttar Pradesh":[26.8467,80.9462],"Haryana":[29.0588,76.0856],"Madhya Pradesh":[22.9734,78.6569],"Tamil Nadu":[11.1271,78.6569],"Kerala":[10.8505,76.2711],"Gujarat":[22.2587,71.1924],"Karnataka":[15.3173,75.7139],"Rajasthan":[27.0238,74.2179],"Andhra Pradesh and Telangana":[16.8,79.5],"Andhra Pradesh":[15.9129,79.74],"Telangana":[18.1124,79.0193],"Bihar":[25.0961,85.3131],"West Bengal":[22.9868,87.855],"Tripura":[23.9408,91.9882],"Odisha":[20.9517,85.0985],"Himachal Pradesh":[31.1048,77.1734],"Assam":[26.2006,92.9376],"Chhattisgarh":[21.2787,81.8661],"Jharkhand":[23.6102,85.2799],"Uttarakhand":[30.0668,79.0193],"Goa":[15.2993,74.124],"Jammu & Kashmir":[33.7782,76.5762],"Nagaland":[26.1584,94.5624],"Meghalaya":[25.467,91.3662],"Arunachal Pradesh":[28.218,94.7278],"Mizoram":[23.1645,92.9376],"Sikkim":[27.533,88.5122],"Manipur":[24.6637,93.9063],"Delhi":[28.7041,77.1025],"Chandigarh":[30.7333,76.7794],"Andaman & Nicobar Islands":[11.7401,92.6586],"Puducherry":[11.9416,79.8083],"Ladakh":[34.1526,77.5771]};
const fmt=n=>Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const fmtM=n=>(Number(n)/1e6).toFixed(2)+" M";
const pct=n=>Number(n).toFixed(1)+"%";

function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');document.querySelectorAll('.navlinks button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));$('navlinks').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});if(id==='home')renderHome();if(id==='intelligence')renderIntelligence();if(id==='gis')setTimeout(renderMap,100);if(id==='action')setupAction();if(id==='compare')populateCompareRegions();if(id==='profile')renderProfile();}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
$('menuBtn').addEventListener('click',()=>$('navlinks').classList.toggle('open'));
function openRoleModal(){$('roleModal').classList.add('show')} function closeRoleModal(){$('roleModal').classList.remove('show')}
function selectRole(role){const name=$('userName').value.trim()||'Guest User';localStorage.setItem('cri_user',JSON.stringify({name,role}));closeRoleModal();showPage('home')}
function getUser(){return JSON.parse(localStorage.getItem('cri_user')||'{"name":"Guest User","role":"Visitor"}')}

function initLanding(){const s=D.stats;$('heroAgri').textContent=s.agriculture.surplus_mt.toFixed(2);$('heroPlastic').textContent=fmtM(s.plastic.latest_generated_tpa)+' t';$('heroEwaste').textContent=pct(s.ewaste.processing_rate);}
function latestE(){return D.ewaste[D.ewaste.length-1]}
function renderHome(){const u=getUser();$('welcomeTitle').textContent=`Welcome, ${u.name}`;const s=D.stats,e=latestE();$('homeSummary').innerHTML=`
<article class="card"><span class="topic-tag">AGRICULTURAL BIOMASS</span><h3>${s.agriculture.surplus_mt.toFixed(2)} Mt/year</h3><p>Reported biomass surplus available as a recovery/utilization signal.</p><div class="kpi"><span>Total generation baseline</span><strong>${s.agriculture.generation_mt.toFixed(2)} Mt/year</strong></div></article>
<article class="card"><span class="topic-tag">PLASTIC WASTE</span><h3>${fmtM(s.plastic.latest_generated_tpa)} t/year</h3><p>State/UT-summed generation in ${s.plastic.latest_year}.</p><div class="kpi"><span>Comparable processing analysis</span><strong>2020–21 & 2021–22</strong></div></article>
<article class="card"><span class="topic-tag">E-WASTE</span><h3>${pct(e.processing_rate)}</h3><p>National processing rate in ${e.year}.</p><div class="kpi"><span>Unrecovered gap</span><strong>${fmt(e.gap_t)} t</strong></div></article>`;
const agTop=[...D.agriculture].sort((a,b)=>b.surplus_mt-a.surplus_mt)[0], plTop=[...D.plastic].sort((a,b)=>b.avg_generation_tpa-a.avg_generation_tpa)[0];
$('recentInsights').innerHTML=[['🌾',`${agTop.region} has the largest biomass surplus in the baseline`,`${agTop.surplus_mt.toFixed(2)} Mt/year surplus • ${pct(agTop.surplus_rate)} surplus rate`],['♻️',`${plTop.region} has the highest five-year average plastic generation among modelled regions`,`${fmt(plTop.avg_generation_tpa)} TPA average generation`],['⚡',`E-waste processing increased but the gap remains substantial`,`${fmt(e.processed_t)} t processed vs ${fmt(e.gap_t)} t unrecovered in ${e.year}`]].map(x=>`<div class="insight"><b>${x[0]}</b><div><strong>${x[1]}</strong><span>${x[2]}</span></div></div>`).join('');}

function renderIntelligence(){const sec=$('intelSector').value,q=$('intelSearch').value.toLowerCase();if(intelChart)intelChart.destroy();if(sec==='agriculture')renderAgriIntelligence(q);else if(sec==='plastic')renderPlasticIntelligence(q);else renderEwasteIntelligence(q);}
function kpi(label,value){return `<div class="kpi"><span>${label}</span><strong>${value}</strong></div>`}
function renderAgriIntelligence(q){const rows=[...D.agriculture].sort((a,b)=>b.generation_mt-a.generation_mt);const totalGen=D.stats.agriculture.generation_mt,totalSur=D.stats.agriculture.surplus_mt,totalUtil=D.stats.agriculture.utilized_mt,rate=totalSur/totalGen*100;$('intelKPIs').innerHTML=kpi('Biomass generation',`${totalGen.toFixed(2)} Mt/yr`)+kpi('Implied utilized',`${totalUtil.toFixed(2)} Mt/yr`)+kpi('Surplus / recovery potential',`${totalSur.toFixed(2)} Mt/yr`)+kpi('Overall surplus share',pct(rate));const top=rows.slice(0,10);intelChart=new Chart($('intelChart'),{type:'bar',data:{labels:top.map(r=>r.region),datasets:[{label:'Generation (Mt/yr)',data:top.map(r=>r.generation_mt)},{label:'Surplus (Mt/yr)',data:top.map(r=>r.surplus_mt)}]},options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}});$('intelChartTitle').textContent='Top agricultural biomass regions: generation vs surplus';$('intelTableTitle').textContent='Agricultural biomass regional data';$('intelHead').innerHTML='<tr><th>Region</th><th>Generation Mt/yr</th><th>Utilized Mt/yr</th><th>Surplus Mt/yr</th><th>Surplus %</th><th>Recovery Opportunity Index</th><th>Category</th></tr>';$('intelTable').innerHTML=rows.filter(r=>r.region.toLowerCase().includes(q)).map(r=>`<tr><td><b>${r.region}</b></td><td>${fmt(r.generation_mt)}</td><td>${fmt(r.utilized_mt)}</td><td>${fmt(r.surplus_mt)}</td><td>${pct(r.surplus_rate)}</td><td>${r.opportunity_index.toFixed(2)}</td><td><span class="badge ${r.opportunity.toLowerCase()}">${r.opportunity}</span></td></tr>`).join('');}
function renderPlasticIntelligence(q){const latest=D.plastic_yearly[D.plastic_yearly.length-1],y20=D.plastic_yearly.find(r=>r.year==='2020-21'),y21=D.plastic_yearly.find(r=>r.year==='2021-22');$('intelKPIs').innerHTML=kpi(`${latest.year} generation`,`${fmtM(latest.generated_tpa)} t`)+kpi('2020–21 reported processed',`${fmtM(y20.processed_tpa)} t`)+kpi('2021–22 reported processed',`${fmtM(y21.processed_tpa)} t`)+kpi('2021–22 processing rate',pct(y21.processing_rate));intelChart=new Chart($('intelChart'),{type:'line',data:{labels:D.plastic_yearly.map(r=>r.year),datasets:[{label:'Plastic generated (TPA)',data:D.plastic_yearly.map(r=>r.generated_tpa),tension:.25,fill:false}]},options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:false}}}});$('intelChartTitle').textContent='Plastic waste generation trend, 2018–19 to 2022–23';const rows=[...D.plastic].sort((a,b)=>b.avg_generation_tpa-a.avg_generation_tpa);$('intelTableTitle').textContent='Plastic state/UT analytical summary';$('intelHead').innerHTML='<tr><th>Region</th><th>5-year avg generation TPA</th><th>Avg reported processed TPA*</th><th>Recovery gap context</th><th>Recovery Opportunity Index</th><th>Category</th></tr>';$('intelTable').innerHTML=rows.filter(r=>r.region.toLowerCase().includes(q)).map(r=>`<tr><td><b>${r.region}</b></td><td>${fmt(r.avg_generation_tpa)}</td><td>${r.avg_processed_tpa==null?'Not standardized':fmt(r.avg_processed_tpa)}</td><td>${pct(r.recovery_gap_fraction*100)}</td><td>${r.opportunity_index.toFixed(2)}</td><td><span class="badge ${r.opportunity.toLowerCase()}">${r.opportunity}</span></td></tr>`).join('');}
function renderEwasteIntelligence(q){const e=latestE();$('intelKPIs').innerHTML=kpi(`${e.year} generated`,`${fmt(e.generated_t)} t`)+kpi(`${e.year} processed`,`${fmt(e.processed_t)} t`)+kpi('Processing rate',pct(e.processing_rate))+kpi('Unrecovered gap',`${fmt(e.gap_t)} t`);intelChart=new Chart($('intelChart'),{type:'line',data:{labels:D.ewaste.map(r=>r.year),datasets:[{label:'Generated (t)',data:D.ewaste.map(r=>r.generated_t)},{label:'Processed (t)',data:D.ewaste.map(r=>r.processed_t)}]},options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}});$('intelChartTitle').textContent='E-waste generated vs processed';$('intelTableTitle').textContent='National e-waste annual data';$('intelHead').innerHTML='<tr><th>Year</th><th>Generated t</th><th>Processed t</th><th>Processing rate</th><th>Gap t</th><th>Authorized recyclers</th><th>Capacity TPA</th><th>Recovery Opportunity Index</th></tr>';$('intelTable').innerHTML=[...D.ewaste].reverse().filter(r=>r.year.toLowerCase().includes(q)).map(r=>`<tr><td><b>${r.year}</b></td><td>${fmt(r.generated_t)}</td><td>${fmt(r.processed_t)}</td><td>${pct(r.processing_rate)}</td><td>${fmt(r.gap_t)}</td><td>${fmt(r.recyclers)}</td><td>${fmt(r.capacity_tpa)}</td><td>${r.opportunity_index.toFixed(2)}</td></tr>`).join('');}
$('intelSector').addEventListener('change',renderIntelligence);$('intelSearch').addEventListener('input',renderIntelligence);
function exportIntelligenceCSV(){const sec=$('intelSector').value;let rows=sec==='agriculture'?D.agriculture:sec==='plastic'?D.plastic:D.ewaste;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${String(r[k]??'').replaceAll('"','""')}"`).join(','))].join('\n');downloadBlob(csv,`${sec}_waste_intelligence.csv`,'text/csv')}

function colorFor(o){return o==='High'?'#258657':o==='Medium'?'#d5982d':'#c75e51'}
function renderMap(){if(typeof L==='undefined')return;if(!map){map=L.map('map').setView([22.5,79],5);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map)}if(mapLayer)mapLayer.clearLayers();mapLayer=L.layerGroup().addTo(map);const sec=$('mapSector').value,rows=sec==='agriculture'?D.agriculture:D.plastic;rows.forEach(r=>{const c=REGION_COORDS[r.region];if(!c)return;let body=sec==='agriculture'?`Generation: ${r.generation_mt.toFixed(2)} Mt/yr<br>Surplus: ${r.surplus_mt.toFixed(2)} Mt/yr<br>Surplus rate: ${pct(r.surplus_rate)}`:`5-year avg generation: ${fmt(r.avg_generation_tpa)} TPA<br>Recovery-gap context: ${pct(r.recovery_gap_fraction*100)}`;L.circleMarker(c,{radius:6+r.opportunity_index/15,color:'#fff',weight:1,fillColor:colorFor(r.opportunity),fillOpacity:.84}).bindPopup(`<b>${r.region}</b><br>${body}<br><small>Recovery Opportunity Index: ${r.opportunity_index.toFixed(2)}</small><br><button onclick="renderRegionAnalysis('${sec}','${r.region.replaceAll("'","\\'")}')">Analyze region</button>`).addTo(mapLayer)});map.invalidateSize()}
$('mapSector').addEventListener('change',renderMap);function jumpToAction(sec,region){showPage('action');$('actionSector').value=sec;setupAction(region)}

function setupAction(preselect){populateSubtype();populateActionRegions(preselect)}
function populateSubtype(){const sec=$('actionSector').value;const items=D.subtypes[sec]||[];$('actionSubtype').innerHTML=items.map(x=>`<option value="${escapeHtml(x.name)}">${escapeHtml(x.name)}</option>`).join('');updateSubtypeExample()}
function updateSubtypeExample(){const sec=$('actionSector').value,name=$('actionSubtype').value;const x=(D.subtypes[sec]||[]).find(s=>s.name===name);$('subtypeExample').textContent=x?`Example: ${x.example}`:''}
function populateActionRegions(preselect){const sec=$('actionSector').value;let regions;if(sec==='agriculture')regions=D.agriculture.map(r=>r.region);else if(sec==='plastic')regions=D.plastic.map(r=>r.region);else regions=Object.keys(REGION_COORDS).filter(x=>x!=='Andhra Pradesh and Telangana');regions=[...new Set(regions)].sort();$('actionRegion').innerHTML=regions.map(r=>`<option>${escapeHtml(r)}</option>`).join('');if(preselect&&regions.includes(preselect))$('actionRegion').value=preselect;}
$('actionSector').addEventListener('change',setupAction);$('actionSubtype').addEventListener('change',updateSubtypeExample);
function pathways(sec,sub){if(sec==='agriculture')return['Aggregation & baling','Pellet / briquette preprocessing','Biomass power procurement','Bio-CNG / other local utilization'];if(sec==='plastic')return['Material-specific segregation','Mechanical recycling where suitable','Authorized processing route','Confirm commercial terms with recycler'];return['Authorized collection','Refurbishment where feasible','Dismantling','Authorized recycling'];}
function recoveryContext(sec,region,qty){if(sec==='agriculture'){const r=D.agriculture.find(x=>x.region===region);return {value:qty*(r.surplus_rate/100),label:'Contextual surplus potential',basis:`Uses the regional biomass surplus share (${pct(r.surplus_rate)}) as a contextual recovery signal.`,index:r.opportunity_index,opp:r.opportunity,raw:r};}if(sec==='plastic'){const r=D.plastic.find(x=>x.region===region);return {value:qty*r.recovery_gap_fraction,label:'Contextual unrecovered potential',basis:`Uses the modelled average recovery-gap fraction (${pct(r.recovery_gap_fraction*100)}) from comparable management years.`,index:r.opportunity_index,opp:r.opportunity,raw:r};}const r=latestE();return {value:qty*r.gap_fraction,label:'Contextual unprocessed potential',basis:`State-level e-waste recovery data are not available in the final model; this uses the latest national processing-gap context (${pct(r.gap_fraction*100)}) for ${r.year}.`,index:r.opportunity_index,opp:r.opportunity,raw:r};}
function subtypeTokens(sec,name){const s=(D.subtypes[sec]||[]).find(x=>x.name===name);return s?s.keywords.map(k=>k.toLowerCase()):[]}
function contactMatches(sec,subtype,state){let rows=D.contacts.filter(c=>c.sector===sec);if(sec==='plastic'){const tokens=subtypeTokens(sec,subtype).flatMap(x=>x.split(/[\/]/)).map(x=>x.trim()).filter(Boolean);rows=rows.filter(c=>{const a=(c.accepted||'').toLowerCase();return tokens.some(t=>a.includes(t))})}const local=rows.filter(c=>c.state===state);const rest=rows.filter(c=>c.state!==state);return [...local,...rest].slice(0,6)}
function contactCard(c){const phone=c.phone?`<a href="tel:${String(c.phone).replace(/\s/g,'')}">📞 ${escapeHtml(c.phone)}</a>`:'';let contact='';if(c.email_or_contact){if(String(c.email_or_contact).includes('@'))contact=`<a href="mailto:${escapeHtml(c.email_or_contact)}">✉ ${escapeHtml(c.email_or_contact)}</a>`;else contact=`<a href="${escapeHtml(c.contact_url)}" target="_blank" rel="noopener">Contact / tender link</a>`}else if(c.contact_url)contact=`<a href="${escapeHtml(c.contact_url)}" target="_blank" rel="noopener">Official contact source</a>`;return `<div class="contact-card"><h5>${escapeHtml(c.company)}</h5><p>📍 ${escapeHtml(c.city||'')}${c.city&&c.state?', ':''}${escapeHtml(c.state||'')}</p><div>${phone}${contact}</div></div>`}
function runActionAnalysis(){const sec=$('actionSector').value,sub=$('actionSubtype').value,region=$('actionRegion').value,qty=parseFloat($('actionQty').value),price=parseFloat($('actionPrice').value);if(!qty||qty<=0){alert('Enter a valid waste quantity.');return}const rc=recoveryContext(sec,region,qty),contacts=contactMatches(sec,sub,region),value=Number.isFinite(price)?rc.value*price:null;const result={timestamp:new Date().toLocaleString(),role:$('actionRole').value,sector:sectorLabel[sec],sectorKey:sec,subtype:sub,region,quantity:qty,recoveryQuantity:rc.value,recoveryLabel:rc.label,basis:rc.basis,index:rc.index,opportunity:rc.opp,value,contacts,pathways:pathways(sec,sub)};sessionStorage.setItem('cri_last_action',JSON.stringify(result));saveHistory(result);renderActionResult(result)}
function renderActionResult(r){const procurementNote=r.sectorKey==='agriculture'?'<p class="contact-note">Biomass procurement records in the current directory primarily relate to agro-residue pellets. Loose residue may require aggregation or pellet/briquette preprocessing before direct procurement.</p>':r.sectorKey==='plastic'?'<p class="contact-note">Recycler listing does not guarantee cash purchase. Contact the company to confirm material specification, minimum quantity and commercial terms.</p>':'<p class="contact-note">Authorized recycler/contact listing does not guarantee purchase. Confirm accepted equipment category and commercial terms directly.</p>';$('actionResult').className='result-card';$('actionResult').innerHTML=`<div class="result-top"><div><span class="topic-tag">${escapeHtml(r.sector.toUpperCase())}</span><h2>${escapeHtml(r.subtype)}</h2><p>${escapeHtml(r.region)}</p><span class="badge ${r.opportunity.toLowerCase()}">${r.opportunity} regional opportunity</span></div><div class="score-mini"><small>Supporting Recovery Opportunity Index</small><strong>${r.index.toFixed(1)}</strong><small>CRROM • not recovery %</small></div></div><div class="action-metrics"><div><small>Your input quantity</small><strong>${r.quantity.toFixed(2)} t</strong></div><div><small>${r.recoveryLabel}</small><strong>${r.recoveryQuantity.toFixed(2)} t</strong></div><div><small>${r.value!==null?'Indicative gross value':'Market value'}</small><strong>${r.value!==null?'₹'+Math.round(r.value).toLocaleString('en-IN'):'Not estimated'}</strong></div></div><div class="action-section"><h4>1. Resource recovery context</h4><p>${r.basis} This is a decision-support estimate, not a technical recovery guarantee.</p></div><div class="action-section"><h4>2. Recommended utilization route</h4><div class="pathways">${r.pathways.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div></div><div class="action-section"><h4>3. Potential companies / facilities to contact</h4>${r.contacts.length?`<div class="contact-grid">${r.contacts.map(contactCard).join('')}</div>`:'<p>No compatible verified contact is currently stored for this selection. Use the official sector portal and expand the directory before claiming a local match.</p>'}${procurementNote}</div><div class="action-section"><h4>4. Next action</h4><p>Contact the listed organization to verify current acceptance, material specifications, quantity requirements, price and logistics before dispatching material.</p></div><button class="btn primary" onclick="downloadActionPDF()">Download Action Report</button>`}
function downloadActionPDF(){const r=JSON.parse(sessionStorage.getItem('cri_last_action')||'null');if(!r)return;const {jsPDF}=window.jspdf;const doc=new jsPDF();let y=18;const line=(t,b=false)=>{doc.setFont('helvetica',b?'bold':'normal');const lines=doc.splitTextToSize(String(t),175);doc.text(lines,18,y);y+=lines.length*6+2;if(y>275){doc.addPage();y=18}};line('Circular Resource Intelligence – Action Report',true);line(`Generated: ${r.timestamp}`);line(`Waste: ${r.sector} – ${r.subtype}`);line(`Region: ${r.region}`);line(`Input quantity: ${r.quantity.toFixed(2)} tonnes`);line(`${r.recoveryLabel}: ${r.recoveryQuantity.toFixed(2)} tonnes`);line(`Basis: ${r.basis}`);line(`Recovery Opportunity Index: ${r.index.toFixed(2)} (${r.opportunity}); this is not a recovery percentage.`);line('Potential contacts',true);r.contacts.forEach(c=>line(`${c.company} | ${c.city||''}, ${c.state||''} | ${c.phone||''} | ${c.email_or_contact||c.contact_url||''}`));line('Important: contact listings do not guarantee purchase or price. Confirm specifications and commercial terms directly.');doc.save('CRI_Action_Report.pdf')}

function compareRows(sec){return sec==='agriculture'?D.agriculture:sec==='plastic'?D.plastic:D.ewaste}
function rowName(sec,r){return sec==='ewaste'?r.year:r.region}
function populateCompareRegions(){const sec=$('compareSector').value,rows=compareRows(sec);$('compareA').innerHTML=rows.map(r=>`<option>${rowName(sec,r)}</option>`).join('');$('compareB').innerHTML=rows.map(r=>`<option>${rowName(sec,r)}</option>`).join('');if(rows.length>1)$('compareB').selectedIndex=1;runComparison()}
$('compareSector').addEventListener('change',populateCompareRegions);
function compareMetrics(sec,r){if(sec==='agriculture')return [['Generation',`${r.generation_mt.toFixed(2)} Mt/yr`],['Utilized',`${r.utilized_mt.toFixed(2)} Mt/yr`],['Surplus',`${r.surplus_mt.toFixed(2)} Mt/yr`],['Surplus share',pct(r.surplus_rate)],['Opportunity index',r.opportunity_index.toFixed(2)]];if(sec==='plastic')return [['5-year avg generation',`${fmt(r.avg_generation_tpa)} TPA`],['Avg reported processed',r.avg_processed_tpa==null?'Not standardized':`${fmt(r.avg_processed_tpa)} TPA`],['Recovery-gap context',pct(r.recovery_gap_fraction*100)],['Opportunity index',r.opportunity_index.toFixed(2)]];return [['Generated',`${fmt(r.generated_t)} t`],['Processed',`${fmt(r.processed_t)} t`],['Processing rate',pct(r.processing_rate)],['Unrecovered gap',`${fmt(r.gap_t)} t`],['Capacity',`${fmt(r.capacity_tpa)} TPA`],['Opportunity index',r.opportunity_index.toFixed(2)]]}
function runComparison(){const sec=$('compareSector').value,rows=compareRows(sec),na=$('compareA').value,nb=$('compareB').value,a=rows.find(r=>rowName(sec,r)===na),b=rows.find(r=>rowName(sec,r)===nb);if(!a||!b)return;$('compareResults').innerHTML=[a,b].map(r=>`<div class="panel compare-card"><span class="topic-tag">${sectorLabel[sec].toUpperCase()}</span><h2>${escapeHtml(rowName(sec,r))}</h2><div class="compare-list">${compareMetrics(sec,r).map(x=>`<div><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}</div></div>`).join('');if(compareChart)compareChart.destroy();let labels,dataA,dataB;if(sec==='agriculture'){labels=['Generation','Surplus'];dataA=[a.generation_mt,a.surplus_mt];dataB=[b.generation_mt,b.surplus_mt]}else if(sec==='plastic'){labels=['Avg generation (000 TPA)','Avg processed (000 TPA)'];dataA=[a.avg_generation_tpa/1000,(a.avg_processed_tpa||0)/1000];dataB=[b.avg_generation_tpa/1000,(b.avg_processed_tpa||0)/1000]}else{labels=['Generated (000 t)','Processed (000 t)','Gap (000 t)'];dataA=[a.generated_t/1000,a.processed_t/1000,a.gap_t/1000];dataB=[b.generated_t/1000,b.processed_t/1000,b.gap_t/1000]}compareChart=new Chart($('compareChart'),{type:'bar',data:{labels,datasets:[{label:na,data:dataA},{label:nb,data:dataB}]},options:{responsive:true,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}})}

function saveHistory(r){const h=JSON.parse(localStorage.getItem('cri_history')||'[]');h.unshift(r);localStorage.setItem('cri_history',JSON.stringify(h.slice(0,12)))}
function renderProfile(){const u=getUser();$('profileInfo').innerHTML=`<div class="profile-row"><small>Name</small><b>${escapeHtml(u.name)}</b></div><div class="profile-row"><small>Role</small><b>${escapeHtml(u.role)}</b></div><div class="profile-row"><small>Storage</small><b>Local browser only</b></div>`;const h=JSON.parse(localStorage.getItem('cri_history')||'[]');$('historyList').innerHTML=h.length?h.map(r=>`<div class="history-item"><b>${escapeHtml(r.sector)} • ${escapeHtml(r.subtype||'')}</b><br><span>${escapeHtml(r.region)} • ${Number(r.quantity).toFixed(2)} t</span><br><small>${escapeHtml(r.timestamp)}</small></div>`).join(''):'<p class="note">No saved analyses yet.</p>'}
function clearHistory(){localStorage.removeItem('cri_history');renderProfile()}
function downloadBlob(content,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
initLanding();setupAction();populateCompareRegions();

// --- FINAL VISION LAYER: subtype-aware pathways, preparation, role advice and compliance ---
function pathwayDetail(sec,sub){
 const ag={
  'Paddy/Rice residue':['Baling & aggregation','Pellet / briquette production','Biomass power co-firing','Bio-CNG / anaerobic digestion where suitable'],
  'Wheat residue':['Baling & aggregation','Pellet / briquette production','Biomass power','Bio-CNG / local industrial fuel'],
  'Sugarcane residue':['Bagasse-based energy / cogeneration','Briquetting where suitable','Bio-CNG / biochemical utilization','Local industrial fuel'],
  'Maize residue':['Aggregation','Briquetting / pelletization','Bio-CNG / biomass energy','Other local biomass utilization'],
  'Cotton residue':['Chipping / size reduction','Briquetting / pelletization','Biomass energy','Industrial fuel'],
  'Groundnut residue':['Cleaning & aggregation','Briquetting / pelletization','Biomass energy','Industrial thermal use'],
  'Other agro-residue':['Identify residue characteristics','Aggregation','Pellet / briquette route where suitable','Local biomass / bioenergy utilization']};
 const pl={PET:['Segregated PET recycling','Bottle/fibre recycling route','Material-specific mechanical recycling'],HDPE:['Segregated HDPE recycling','Mechanical recycling into granules / products'], 'LDPE/PE':['Clean-film segregation','Mechanical recycling where contamination permits','Authorized alternative processing where recycling is unsuitable'],PP:['Segregated PP recycling','Mechanical recycling / reprocessing'],PVC:['PVC-specific recycler route','Avoid mixing with other polymer streams'], 'ABS/HIPS/PS':['Engineering-plastic segregation','Specialist mechanical recycler route'],PC:['Polycarbonate-specific recycler route','Specialist engineering-plastic recovery'],'Mixed supported plastics':['Sort by polymer before dispatch','Route each compatible fraction to a material-specific recycler','Use authorized processing for non-recyclable fractions']};
 const ew={'Computers & IT equipment':['Reuse / refurbishment first where functional','Authorized collection','Dismantling and material recovery','Authorized recycling'],'Phones & telecom':['Reuse / refurbishment where feasible','Authorized collection','Component/material recovery','Authorized recycling'],'Consumer electronics':['Reuse / repair where feasible','Authorized dismantling','Material recovery','Authorized recycling'],'Large appliances':['Authorized collection','Safe dismantling','Component/material recovery','Authorized recycling'],'Other notified EEE':['Identify EEE category','Authorized collection','Refurbishment where feasible','Authorized recycling']};
 return (sec==='agriculture'?ag:sec==='plastic'?pl:ew)[sub] || pathways(sec,sub);
}
function preparationAdvice(sec,sub){
 if(sec==='agriculture') return 'Keep the residue segregated and reasonably dry. Loose crop residue may need baling, aggregation, size reduction or pellet/briquette conversion before an industrial procurer can accept it. Confirm moisture, ash, size and pellet specifications with the procurer before transport.';
 if(sec==='plastic') return 'Segregate the material by polymer type and keep it as clean as practicable. Do not mix incompatible polymers. Confirm contamination limits, form (flakes/bales/scrap), minimum quantity and transport terms with the recycler.';
 return 'Keep e-waste intact and segregated by equipment category where possible. Do not dismantle hazardous components informally. Route it through an authorized collection/recycling channel and confirm the accepted EEE category before dispatch.';
}
function complianceAdvice(sec){
 if(sec==='agriculture') return 'Check current local/state requirements for residue transport and any buyer specification. For pellet procurement, use the current tender/procurement conditions of the relevant plant; this prototype does not treat a historical tender as a standing purchase commitment.';
 if(sec==='plastic') return 'Use a registered/authorized plastic waste processor and verify current Plastic Waste Management / EPR requirements applicable to the transaction. A directory listing is a contact route, not proof of a current purchase contract.';
 return 'Use authorized e-waste collection, refurbishment, dismantling or recycling channels under the applicable E-Waste Management framework. Do not route regulated e-waste to an unverified informal processor.';
}
function roleAdvice(role,sec){
 const map={Farmer:'Focus on segregation, aggregation and the material form required by the receiving industry. Do not transport material until the procurer confirms specifications and terms.',Industry:'Use the recovery-gap and subtype information to screen potential secondary-resource opportunities, then verify feedstock quality, continuity, price and logistics directly.',Government:'Use the regional gap and opportunity index to identify where deeper infrastructure, collection or market-linkage assessment may be justified; the index is a prioritization tool, not a sanctioning rule.',Researcher:'Use the raw quantities, sector-specific recovery measure and CRROM separately. Preserve the stated data-granularity and proxy limitations when interpreting results.'};
 return map[role]||'Use the analysis as decision support and verify operational conditions with the relevant organization.';
}
// Override the earlier generic pathway function with subtype-aware logic.
pathways=function(sec,sub){return pathwayDetail(sec,sub)};

// Override final renderer so the Action Center follows UNDERSTAND → LOCATE → PRIORITIZE → ACT.
renderActionResult=function(r){
 const procurementNote=r.sectorKey==='agriculture'?'Current biomass contacts are procurement routes primarily for agro-residue pellets. A farmer with loose residue may first need an aggregator or pellet/briquette processor.':r.sectorKey==='plastic'?'Recycler listings do not guarantee cash purchase. Confirm accepted material, minimum quantity and commercial terms directly.':'Authorized recycler listings do not guarantee cash purchase. Confirm the EEE category, acceptance and commercial terms directly.';
 const prep=preparationAdvice(r.sectorKey,r.subtype), comp=complianceAdvice(r.sectorKey), role=roleAdvice(r.role,r.sectorKey);
 r.preparation=prep; r.compliance=comp; r.roleAdvice=role; sessionStorage.setItem('cri_last_action',JSON.stringify(r));
 $('actionResult').className='result-card';
 $('actionResult').innerHTML=`<div class="result-top"><div><span class="topic-tag">${escapeHtml(r.sector.toUpperCase())}</span><h2>${escapeHtml(r.subtype)}</h2><p>${escapeHtml(r.region)} • ${r.quantity.toFixed(2)} tonnes</p><span class="badge ${r.opportunity.toLowerCase()}">${r.opportunity} regional opportunity</span></div><div class="score-mini"><small>Supporting Recovery Opportunity Index</small><strong>${r.index.toFixed(1)}</strong><small>CRROM • not recovery %</small></div></div>
 <div class="action-metrics"><div><small>Your input quantity</small><strong>${r.quantity.toFixed(2)} t</strong></div><div><small>${r.recoveryLabel}</small><strong>${r.recoveryQuantity.toFixed(2)} t</strong></div><div><small>${r.value!==null?'Indicative gross value':'Market value'}</small><strong>${r.value!==null?'₹'+Math.round(r.value).toLocaleString('en-IN'):'Not estimated'}</strong></div></div>
 <div class="role-advice"><small>ROLE-SPECIFIC DECISION SUPPORT • ${escapeHtml(r.role.toUpperCase())}</small><p>${escapeHtml(role)}</p></div>
 <div class="action-section"><h4><span class="action-step-no">1</span>Understand the recovery context</h4><p>${escapeHtml(r.basis)} This contextual estimate is not a technical recovery guarantee.</p></div>
 <div class="action-section"><h4><span class="action-step-no">2</span>Choose a utilization pathway</h4><div class="pathways">${r.pathways.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div><div class="prep-box"><h5>Before you contact a resource user</h5><p>${escapeHtml(prep)}</p></div></div>
 <div class="action-section"><h4><span class="action-step-no">3</span>Potential resource users / recyclers to contact</h4>${r.contacts.length?`<div class="contact-grid">${r.contacts.map(contactCard).join('')}</div>`:'<p>No compatible verified contact is currently stored for this selection. The platform will not invent a local buyer.</p>'}<p class="contact-scope">${escapeHtml(procurementNote)}</p></div>
 <div class="action-section"><h4><span class="action-step-no">4</span>Compliance & verification</h4><div class="compliance-box"><p>${escapeHtml(comp)}</p></div></div>
 <div class="action-section"><h4><span class="action-step-no">5</span>Recommended next action</h4><p>Shortlist a compatible contact, confirm current acceptance and specifications, agree commercial/logistics terms, and only then arrange movement of the material. Use the downloaded Action Report as a decision summary—not as a purchase authorization.</p></div>
 <button class="btn primary" onclick="downloadActionPDF()">Download Action Report</button>`;
};

// Override PDF to preserve the full final decision journey.
downloadActionPDF=function(){const r=JSON.parse(sessionStorage.getItem('cri_last_action')||'null');if(!r)return;const {jsPDF}=window.jspdf;const doc=new jsPDF();let y=18;const line=(t,b=false)=>{doc.setFont('helvetica',b?'bold':'normal');const ls=doc.splitTextToSize(String(t),175);if(y+ls.length*6>280){doc.addPage();y=18}doc.text(ls,18,y);y+=ls.length*6+2};line('Circular Resource Intelligence - Action Report',true);line(`Generated: ${r.timestamp}`);line(`Role: ${r.role}`);line(`Waste: ${r.sector} - ${r.subtype}`);line(`Region: ${r.region}`);line(`Input quantity: ${r.quantity.toFixed(2)} tonnes`);line(`${r.recoveryLabel}: ${r.recoveryQuantity.toFixed(2)} tonnes`);line(`Recovery context: ${r.basis}`);line(`Recovery Opportunity Index: ${r.index.toFixed(2)} (${r.opportunity}) - supporting prioritization metric, not recovery percentage.`);line('Role-specific guidance',true);line(r.roleAdvice||roleAdvice(r.role,r.sectorKey));line('Suitable utilization pathways',true);(r.pathways||[]).forEach(x=>line('- '+x));line('Material preparation',true);line(r.preparation||preparationAdvice(r.sectorKey,r.subtype));line('Potential contacts',true);(r.contacts||[]).forEach(c=>line(`${c.company} | ${c.city||''}${c.city&&c.state?', ':''}${c.state||''} | ${c.phone||''} | ${c.email_or_contact||c.contact_url||''}`));line('Compliance / verification',true);line(r.compliance||complianceAdvice(r.sectorKey));line('Important: contact listings do not guarantee purchase, price or acceptance. Confirm specifications, current procurement status, commercial terms and logistics directly before dispatch.');doc.save('CRI_Action_Report.pdf')};

// ============================================================================
// MENTOR CORRECTION PACK — authentication gate, multilingual core UI,
// consistent e-waste home metric, resilient GIS, and verified contact routes.
// ============================================================================

const CRI_LANG_KEY='cri_language';
localStorage.setItem(CRI_LANG_KEY,'en');
const CRI_AUTH_USERS='cri_auth_users';
const CRI_AUTH_SESSION='cri_auth_session';
let criAuthMode='login';
let criPendingPage=null;
let criPendingAction=null;
const criOriginalTextNodes=new WeakMap();

const CRI_TRANSLATIONS={
  hi:{
    'Home':'होम','Waste Intelligence':'वेस्ट इंटेलिजेंस','GIS Map':'GIS मानचित्र','Action Center':'एक्शन सेंटर','Compare':'तुलना','Knowledge Hub':'ज्ञान केंद्र','Profile':'प्रोफ़ाइल',
    'Get Started':'शुरू करें','Open Action Center':'एक्शन सेंटर खोलें','Take action →':'कार्रवाई करें →','New Analysis':'नया विश्लेषण','Login / Sign up':'लॉगिन / साइन अप','Logout':'लॉगआउट',
    'From waste data to':'कचरा डेटा से','recovery action.':'रिकवरी कार्रवाई तक।','Understand. Locate. Act.':'समझें। स्थान पहचानें। कार्रवाई करें।',
    'Waste Intelligence':'वेस्ट इंटेलिजेंस','GIS Resource Map':'GIS संसाधन मानचित्र','Action Center':'एक्शन सेंटर','Region Comparison':'क्षेत्र तुलना','Policies & circular pathways':'नीतियाँ और सर्कुलर उपयोग मार्ग','Your workspace':'आपका कार्यक्षेत्र',
    'Analyze your waste':'अपने कचरे का विश्लेषण करें','User role':'उपयोगकर्ता भूमिका','Waste type':'कचरे का प्रकार','Waste subtype':'कचरे का उप-प्रकार','State / Region':'राज्य / क्षेत्र','Waste quantity (tonnes)':'कचरे की मात्रा (टन)','Optional local market value (₹ / tonne)':'वैकल्पिक स्थानीय बाजार मूल्य (₹ / टन)','Generate Action Plan':'एक्शन प्लान बनाएं',
    'Your action plan will appear here':'आपका एक्शन प्लान यहाँ दिखाई देगा','ACCOUNT REQUIRED FOR ACTION PLANS':'एक्शन प्लान के लिए खाता आवश्यक','Login or create an account':'लॉगिन करें या खाता बनाएं','Login':'लॉगिन','Sign up':'साइन अप','Name':'नाम','Email':'ईमेल','Role':'भूमिका','Password':'पासवर्ड',
    'UNDERSTAND':'समझें','LOCATE':'स्थान पहचानें','PRIORITIZE':'प्राथमिकता दें','ACT':'कार्रवाई करें','Loading GIS map…':'GIS मानचित्र लोड हो रहा है…',
    'Agricultural Biomass':'कृषि बायोमास','Plastic Waste':'प्लास्टिक कचरा','E-Waste':'ई-कचरा','Farmer':'किसान','Industry':'उद्योग','Government':'सरकार','Researcher':'शोधकर्ता',
    'Download Action Report':'एक्शन रिपोर्ट डाउनलोड करें','Recommended next action':'अगली अनुशंसित कार्रवाई','Compliance & verification':'अनुपालन और सत्यापन','Potential resource users / recyclers to contact':'संपर्क हेतु संभावित संसाधन उपयोगकर्ता / रीसाइक्लर','Choose a utilization pathway':'उपयोग मार्ग चुनें','Understand the recovery context':'रिकवरी संदर्भ समझें','Before you contact a resource user':'संसाधन उपयोगकर्ता से संपर्क करने से पहले',
    'English':'English','हिन्दी':'हिन्दी','मराठी':'मराठी','Map layer':'मानचित्र परत','Recovery Opportunity Index':'रिकवरी अवसर सूचकांक'
  },
  mr:{
    'Home':'मुख्यपृष्ठ','Waste Intelligence':'कचरा बुद्धिमत्ता','GIS Map':'GIS नकाशा','Action Center':'कृती केंद्र','Compare':'तुलना','Knowledge Hub':'ज्ञान केंद्र','Profile':'प्रोफाइल',
    'Get Started':'सुरू करा','Open Action Center':'कृती केंद्र उघडा','Take action →':'कृती करा →','New Analysis':'नवीन विश्लेषण','Login / Sign up':'लॉगिन / साइन अप','Logout':'लॉगआउट',
    'From waste data to':'कचरा डेटापासून','recovery action.':'पुनर्प्राप्ती कृतीपर्यंत।','Understand. Locate. Act.':'समजा. स्थान ओळखा. कृती करा.',
    'Waste Intelligence':'कचरा बुद्धिमत्ता','GIS Resource Map':'GIS संसाधन नकाशा','Action Center':'कृती केंद्र','Region Comparison':'प्रदेश तुलना','Policies & circular pathways':'धोरणे आणि परिपत्रक वापर मार्ग','Your workspace':'आपले कार्यक्षेत्र',
    'Analyze your waste':'आपल्या कचऱ्याचे विश्लेषण करा','User role':'वापरकर्ता भूमिका','Waste type':'कचऱ्याचा प्रकार','Waste subtype':'कचऱ्याचा उपप्रकार','State / Region':'राज्य / प्रदेश','Waste quantity (tonnes)':'कचऱ्याचे प्रमाण (टन)','Optional local market value (₹ / tonne)':'पर्यायी स्थानिक बाजार मूल्य (₹ / टन)','Generate Action Plan':'कृती आराखडा तयार करा',
    'Your action plan will appear here':'आपला कृती आराखडा येथे दिसेल','ACCOUNT REQUIRED FOR ACTION PLANS':'कृती आराखड्यासाठी खाते आवश्यक','Login or create an account':'लॉगिन करा किंवा खाते तयार करा','Login':'लॉगिन','Sign up':'साइन अप','Name':'नाव','Email':'ईमेल','Role':'भूमिका','Password':'पासवर्ड',
    'UNDERSTAND':'समजा','LOCATE':'स्थान ओळखा','PRIORITIZE':'प्राधान्य द्या','ACT':'कृती करा','Loading GIS map…':'GIS नकाशा लोड होत आहे…',
    'Agricultural Biomass':'कृषी बायोमास','Plastic Waste':'प्लास्टिक कचरा','E-Waste':'ई-कचरा','Farmer':'शेतकरी','Industry':'उद्योग','Government':'शासन','Researcher':'संशोधक',
    'Download Action Report':'कृती अहवाल डाउनलोड करा','Recommended next action':'पुढील शिफारस केलेली कृती','Compliance & verification':'अनुपालन आणि पडताळणी','Potential resource users / recyclers to contact':'संपर्कासाठी संभाव्य संसाधन वापरकर्ते / पुनर्वापरकर्ते','Choose a utilization pathway':'वापर मार्ग निवडा','Understand the recovery context':'पुनर्प्राप्ती संदर्भ समजा','Before you contact a resource user':'संसाधन वापरकर्त्याशी संपर्क करण्यापूर्वी',
    'English':'English','हिन्दी':'हिन्दी','मराठी':'मराठी','Map layer':'नकाशा स्तर','Recovery Opportunity Index':'पुनर्प्राप्ती संधी निर्देशांक'
  }
};

function currentLanguage(){return 'en'}
function tr(text){const lang=currentLanguage();return lang==='en'?text:(CRI_TRANSLATIONS[lang]?.[text]||text)}
function applyLanguage(lang){
  localStorage.setItem(CRI_LANG_KEY,lang);
  document.documentElement.lang=lang==='hi'?'hi':lang==='mr'?'mr':'en';
  if($('languageSelect')) $('languageSelect').value=lang;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    if(['SCRIPT','STYLE','OPTION'].includes(node.parentElement?.tagName)) return;
    if(!criOriginalTextNodes.has(node)) criOriginalTextNodes.set(node,node.nodeValue);
    const original=criOriginalTextNodes.get(node);
    const trimmed=original.trim();
    if(!trimmed) return;
    const mapped=lang==='en'?trimmed:(CRI_TRANSLATIONS[lang]?.[trimmed]||trimmed);
    node.nodeValue=original.replace(trimmed,mapped);
  });
  renderHome();
  updateAuthNav();
  updateActionUserStatus();
}
if($('languageSelect')) $('languageSelect').addEventListener('change',e=>applyLanguage(e.target.value));

async function hashPassword(value){
  const data=new TextEncoder().encode(value);
  const hash=await crypto.subtle.digest('SHA-256',data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function getAuthSession(){try{return JSON.parse(localStorage.getItem(CRI_AUTH_SESSION)||'null')}catch{return null}}
function isAuthenticated(){return !!getAuthSession()?.email}
function getAuthUsers(){try{return JSON.parse(localStorage.getItem(CRI_AUTH_USERS)||'{}')}catch{return {}}}
function openAuthModal(pendingPage='action'){
  criPendingPage=pendingPage||'action';
  setAuthMode('login');
  $('authMessage').textContent='';
  $('authModal').classList.add('show');
}
function closeAuthModal(){$('authModal').classList.remove('show')}
function setAuthMode(mode){
  criAuthMode=mode;
  $('loginTab').classList.toggle('active',mode==='login');
  $('signupTab').classList.toggle('active',mode==='signup');
  $('authNameWrap').style.display=mode==='signup'?'flex':'none';
  $('authRole').parentElement.style.display=mode==='signup'?'flex':'none';
  $('authSubmit').textContent=mode==='signup'?tr('Sign up'):tr('Login');
  $('authTitle').textContent=mode==='signup'?'Create your CRI prototype account':tr('Login or create an account');
  $('authMessage').textContent='';
}
async function submitAuth(){
  const email=$('authEmail').value.trim().toLowerCase(), password=$('authPassword').value;
  if(!email || !email.includes('@') || password.length<4){$('authMessage').textContent='Enter a valid email and a password of at least 4 characters.';return}
  const users=getAuthUsers(); const passwordHash=await hashPassword(password);
  if(criAuthMode==='signup'){
    if(users[email]){$('authMessage').textContent='An account already exists for this email. Please log in.';return}
    const name=$('authName').value.trim(); if(!name){$('authMessage').textContent='Please enter your name.';return}
    users[email]={name,email,role:$('authRole').value,passwordHash};
    localStorage.setItem(CRI_AUTH_USERS,JSON.stringify(users));
  } else {
    if(!users[email] || users[email].passwordHash!==passwordHash){$('authMessage').textContent='Email or password is incorrect for this browser.';return}
  }
  const u=users[email];
  localStorage.setItem(CRI_AUTH_SESSION,JSON.stringify({name:u.name,email:u.email,role:u.role}));
  localStorage.setItem('cri_user',JSON.stringify({name:u.name,role:u.role,email:u.email}));
  closeAuthModal(); updateAuthNav(); updateActionUserStatus();
  const target=criPendingPage||'action'; criPendingPage=null;
  _criBaseShowPage(target);
  if(target==='action'){
    $('actionRole').value=u.role;
    if(criPendingAction){$('actionSector').value=criPendingAction.sec;setupAction(criPendingAction.region);criPendingAction=null}else setupAction();
  }
}
function logoutCRI(){localStorage.removeItem(CRI_AUTH_SESSION);updateAuthNav();if(document.querySelector('#action.page.active'))_criBaseShowPage('landing')}
function updateAuthNav(){
  const b=$('authNavBtn'); if(!b)return; const u=getAuthSession();
  if(u){b.textContent=`${u.name} • ${tr('Logout')}`;b.classList.add('logged-in');b.onclick=()=>logoutCRI()}
  else{b.textContent=tr('Login / Sign up');b.classList.remove('logged-in');b.onclick=()=>openAuthModal('action')}
}
function updateActionUserStatus(){const el=$('actionUserStatus');if(!el)return;const u=getAuthSession();el.innerHTML=u?`✓ Signed in as <b>${escapeHtml(u.name)}</b> • ${escapeHtml(u.role)}`:'🔒 Login or sign up is required before generating an Action Plan.'}
function openProtectedPage(id,preselect=null){
  if(id==='action'&&!isAuthenticated()){criPendingPage='action';criPendingAction=preselect;openAuthModal('action');return}
  _criBaseShowPage(id); if(id==='action'&&preselect){$('actionSector').value=preselect.sec;setupAction(preselect.region)}
}
const _criBaseShowPage=showPage;
showPage=function(id){if(id==='action'&&!isAuthenticated()){openAuthModal('action');return}_criBaseShowPage(id);if(id==='action')updateActionUserStatus()};
jumpToAction=function(sec,region){openProtectedPage('action',{sec,region})};

// Consistent home/landing headline metrics: all three sectors lead with generation-scale quantities.
initLanding=function(){
  const s=D.stats, avgE=s.ewaste.avg_generated_tpa || (D.ewaste.reduce((a,r)=>a+r.generated_t,0)/D.ewaste.length);
  $('heroAgri').textContent=s.agriculture.generation_mt.toFixed(2);
  $('heroAgri').nextElementSibling.textContent='Agricultural biomass generation • baseline Mt/year';
  $('heroPlastic').textContent=fmtM(D.plastic.reduce((a,r)=>a+r.avg_generation_tpa,0)/D.plastic.length)+' t/region';
  $('heroPlastic').nextElementSibling.textContent='Plastic generation • avg across modelled regions';
  $('heroEwaste').textContent=fmtM(avgE)+' t/year';
  if($('heroEwasteLabel')) $('heroEwasteLabel').textContent='E-waste generated • 5-year national average';
};
renderHome=function(){
  const u=getAuthSession()||getUser(),s=D.stats,e=latestE();
  const agAvg=s.agriculture.generation_mt/D.agriculture.length;
  const plAvg=D.plastic.reduce((a,r)=>a+r.avg_generation_tpa,0)/D.plastic.length;
  const ewAvg=s.ewaste.avg_generated_tpa || D.ewaste.reduce((a,r)=>a+r.generated_t,0)/D.ewaste.length;
  $('welcomeTitle').textContent=u?.name&&u.name!=='Guest User'?`Welcome, ${u.name}`:'Circular Resource Intelligence';
  $('homeSummary').innerHTML=`
  <article class="card"><span class="topic-tag">AGRICULTURAL BIOMASS</span><h3>${agAvg.toFixed(2)} Mt/year</h3><p>Average state/region biomass generation in the available baseline.</p><div class="kpi"><span>India/region total baseline</span><strong>${s.agriculture.generation_mt.toFixed(2)} Mt/year</strong></div></article>
  <article class="card"><span class="topic-tag">PLASTIC WASTE</span><h3>${fmt(plAvg)} t/year</h3><p>Average state/UT generation across the five-year analytical series.</p><div class="kpi"><span>Latest national state-sum</span><strong>${fmtM(s.plastic.latest_generated_tpa)} t/year</strong></div></article>
  <article class="card"><span class="topic-tag">E-WASTE</span><h3>${fmtM(ewAvg)} t/year</h3><p>Five-year average national e-waste generation (${s.ewaste.avg_years||'2018–19 to 2022–23'}).</p><div class="kpi"><span>${e.year} processing rate</span><strong>${pct(e.processing_rate)}</strong></div></article>`;
  const agTop=[...D.agriculture].sort((a,b)=>b.surplus_mt-a.surplus_mt)[0],plTop=[...D.plastic].sort((a,b)=>b.avg_generation_tpa-a.avg_generation_tpa)[0];
  $('recentInsights').innerHTML=[['🌾',`${agTop.region} has the largest biomass surplus in the baseline`,`${agTop.surplus_mt.toFixed(2)} Mt/year surplus • ${pct(agTop.surplus_rate)} surplus rate`],['♻️',`${plTop.region} has the highest five-year average plastic generation among modelled regions`,`${fmt(plTop.avg_generation_tpa)} TPA average generation`],['⚡',`E-waste processing increased but the gap remains substantial`,`${fmt(e.processed_t)} t processed vs ${fmt(e.gap_t)} t unrecovered in ${e.year}`]].map(x=>`<div class="insight"><b>${x[0]}</b><div><strong>${x[1]}</strong><span>${x[2]}</span></div></div>`).join('');
};

// Resilient GIS renderer. It reports status instead of silently failing.
renderMap=function(){
  const status=$('mapStatus');
  if(typeof L==='undefined'){
    if(status){status.className='map-status warn';status.textContent='GIS library could not load. Check the internet connection and refresh the page; the analytical data remain available in Waste Intelligence.'}
    return;
  }
  try{
    if(!map){
      map=L.map('map',{zoomControl:true}).setView([22.5,79],5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:18}).addTo(map);
    }
    if(mapLayer)mapLayer.clearLayers();
    mapLayer=L.layerGroup().addTo(map);
    const sec=$('mapSector').value,rows=sec==='agriculture'?D.agriculture:D.plastic;
    let plotted=0;
    rows.forEach(r=>{const c=REGION_COORDS[r.region];if(!c)return;plotted++;let body=sec==='agriculture'?`Generation: ${r.generation_mt.toFixed(2)} Mt/yr<br>Surplus: ${r.surplus_mt.toFixed(2)} Mt/yr<br>Surplus rate: ${pct(r.surplus_rate)}`:`5-year avg generation: ${fmt(r.avg_generation_tpa)} TPA<br>Recovery-gap context: ${pct(r.recovery_gap_fraction*100)}`;L.circleMarker(c,{radius:6+r.opportunity_index/15,color:'#fff',weight:1,fillColor:colorFor(r.opportunity),fillOpacity:.84}).bindPopup(`<b>${escapeHtml(r.region)}</b><br>${body}<br><small>Recovery Opportunity Index: ${r.opportunity_index.toFixed(2)}</small><br><button onclick="renderRegionAnalysis('${sec}','${String(r.region).replaceAll("'","\\'")}')">Analyze region</button>`).addTo(mapLayer)});
    setTimeout(()=>map.invalidateSize(true),150);setTimeout(()=>map.invalidateSize(true),600);
    if(status){status.className='map-status ok';status.textContent=`GIS active • ${plotted} regional analytical markers loaded • click a marker for details.`}
  }catch(err){console.error('GIS error',err);if(status){status.className='map-status warn';status.textContent='GIS encountered a display error. Refresh once; if the base map is blocked, the regional analysis remains available in the table.'}}
};

// Better contact matching: require usable contact details, prioritize selected state,
// then verified nationwide/nearby routes. Agriculture includes both procurement and
// aggregator/supplier contacts; e-waste includes official pan-India recyclers.
contactMatches=function(sec,subtype,state){
  let rows=D.contacts.filter(c=>c.sector===sec && (c.phone||c.email_or_contact||c.contact_url));
  if(sec==='plastic'){
    const tokens=subtypeTokens(sec,subtype).flatMap(x=>x.split(/[\/;]/)).map(x=>x.trim()).filter(Boolean);
    rows=rows.filter(c=>{const a=(c.accepted||'').toLowerCase();return tokens.some(t=>a.includes(t))});
  }
  if(sec==='agriculture'){
    const rawWords={'Paddy/Rice residue':['paddy','rice','agro','raw agricultural'],'Wheat residue':['wheat','agro','raw agricultural'],'Sugarcane residue':['agro','raw agricultural','biomass'],'Maize residue':['agro','raw agricultural','biomass'],'Cotton residue':['agro','raw agricultural','biomass'],'Groundnut residue':['groundnut','agro','raw agricultural'],'Other agro-residue':['agro','raw agricultural','biomass']};
    const tokens=(rawWords[subtype]||['agro','biomass']);
    rows=rows.filter(c=>tokens.some(t=>(c.accepted||'').toLowerCase().includes(t)) || /procur|samarth|ntpc|nabha/i.test((c.internal_match_type||'')+' '+c.company));
  }
  const local=rows.filter(c=>c.state===state);
  const near=rows.filter(c=>c.state!==state && /pan-india|network|mission|procurement guidance/i.test((c.city||'')+' '+(c.internal_match_type||'')));
  const rest=rows.filter(c=>c.state!==state&&!near.includes(c));
  const score=c=>(c.phone?2:0)+(c.email_or_contact?.includes('@')?2:0)+(c.contact_url?1:0);
  local.sort((a,b)=>score(b)-score(a));near.sort((a,b)=>score(b)-score(a));rest.sort((a,b)=>score(b)-score(a));
  return [...local,...near,...rest].slice(0,8);
};
contactCard=function(c){
  const cleanPhone=String(c.phone||'').split('/')[0].replace(/[^+\d]/g,'');
  const phone=c.phone?`<a href="tel:${cleanPhone}">📞 ${escapeHtml(c.phone)}</a>`:'';
  const email=c.email_or_contact&&String(c.email_or_contact).includes('@')?`<a href="mailto:${escapeHtml(c.email_or_contact)}">✉ ${escapeHtml(c.email_or_contact)}</a>`:'';
  const source=c.contact_url?`<a class="source-link" href="${escapeHtml(c.contact_url)}" target="_blank" rel="noopener">🔗 Official / verified source</a>`:'';
  return `<div class="contact-card"><h5>${escapeHtml(c.company)}</h5><span class="contact-type">${escapeHtml(c.internal_match_type||'Verified contact route')}</span><p>📍 ${escapeHtml(c.city||'')}${c.city&&c.state?', ':''}${escapeHtml(c.state||'')}</p><div class="contact-actions">${phone}${email}</div>${source}</div>`;
};

const _criBaseRunAction=runActionAnalysis;
runActionAnalysis=function(){
  if(!isAuthenticated()){openAuthModal('action');return}
  const u=getAuthSession(); if(u&&$('actionRole'))$('actionRole').value=u.role;
  _criBaseRunAction();
};

// Re-render result with clearer contact details and language-sensitive section labels.
renderActionResult=function(r){
  const procurementNote=r.sectorKey==='agriculture'?'The contacts below may include raw-residue aggregators/suppliers and industrial pellet procurement routes. Loose residue may need aggregation or pellet/briquette conversion before a thermal-power buyer can accept it.':r.sectorKey==='plastic'?'Recycler listings are verified contact routes, not guaranteed purchase contracts. Confirm polymer specification, contamination limits, minimum quantity, price and logistics directly.':'Official e-waste contacts are recycling/collection routes; they do not guarantee a cash purchase. Confirm equipment category, pickup/acceptance and commercial terms directly.';
  const prep=preparationAdvice(r.sectorKey,r.subtype),comp=complianceAdvice(r.sectorKey),role=roleAdvice(r.role,r.sectorKey);
  r.preparation=prep;r.compliance=comp;r.roleAdvice=role;sessionStorage.setItem('cri_last_action',JSON.stringify(r));
  $('actionResult').className='result-card';
  $('actionResult').innerHTML=`<div class="result-top"><div><span class="topic-tag">${escapeHtml(r.sector.toUpperCase())}</span><h2>${escapeHtml(r.subtype)}</h2><p>${escapeHtml(r.region)} • ${r.quantity.toFixed(2)} tonnes</p><span class="badge ${r.opportunity.toLowerCase()}">${r.opportunity} regional opportunity</span></div><div class="score-mini"><small>Supporting Recovery Opportunity Index</small><strong>${r.index.toFixed(1)}</strong><small>CRROM • not recovery %</small></div></div>
  <div class="action-metrics"><div><small>Your input quantity</small><strong>${r.quantity.toFixed(2)} t</strong></div><div><small>${r.recoveryLabel}</small><strong>${r.recoveryQuantity.toFixed(2)} t</strong></div><div><small>${r.value!==null?'Indicative gross value':'Market value'}</small><strong>${r.value!==null?'₹'+Math.round(r.value).toLocaleString('en-IN'):'Not estimated'}</strong></div></div>
  <div class="role-advice"><small>ROLE-SPECIFIC DECISION SUPPORT • ${escapeHtml(r.role.toUpperCase())}</small><p>${escapeHtml(role)}</p></div>
  <div class="action-section"><h4><span class="action-step-no">1</span>${tr('Understand the recovery context')}</h4><p>${escapeHtml(r.basis)} This contextual estimate is not a technical recovery guarantee.</p></div>
  <div class="action-section"><h4><span class="action-step-no">2</span>${tr('Choose a utilization pathway')}</h4><div class="pathways">${r.pathways.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div><div class="prep-box"><h5>${tr('Before you contact a resource user')}</h5><p>${escapeHtml(prep)}</p></div></div>
  <div class="action-section"><h4><span class="action-step-no">3</span>${tr('Potential resource users / recyclers to contact')}</h4>${r.contacts.length?`<div class="contact-grid">${r.contacts.map(contactCard).join('')}</div>`:'<p>No compatible verified contact is currently stored for this selection. The platform will not invent a local buyer.</p>'}<p class="contact-scope">${escapeHtml(procurementNote)}</p></div>
  <div class="action-section"><h4><span class="action-step-no">4</span>${tr('Compliance & verification')}</h4><div class="compliance-box"><p>${escapeHtml(comp)}</p></div></div>
  <div class="action-section"><h4><span class="action-step-no">5</span>${tr('Recommended next action')}</h4><p>Shortlist a compatible contact, use the phone/email/source shown above to confirm current acceptance and specifications, agree commercial/logistics terms, and only then arrange movement of the material.</p></div>
  <button class="btn primary" onclick="downloadActionPDF()">${tr('Download Action Report')}</button>`;
};

// Initial correction-pack setup.
initLanding();
updateAuthNav();
updateActionUserStatus();
applyLanguage(currentLanguage());

// ===== FINAL MENTOR LOGIC PATCH =====
// Column-level sorting/filtering for Waste Intelligence.
let intelSort={key:null,dir:'desc',category:'All'};
function intelHeader(label,key,category=false){
  if(category) return `<th>${label}<select class="th-filter" onchange="intelSort.category=this.value;renderIntelligence()"><option>All</option><option>High</option><option>Medium</option><option>Low</option></select></th>`;
  return `<th>${label}<select class="th-filter" onchange="intelSort.key='${key}';intelSort.dir=this.value;renderIntelligence()"><option value="">Sort</option><option value="desc">High → Low</option><option value="asc">Low → High</option></select></th>`;
}
function intelPrepare(rows,q,nameKey='region'){
  let out=rows.filter(r=>String(r[nameKey]??'').toLowerCase().includes(q));
  if(intelSort.category!=='All') out=out.filter(r=>(r.opportunity||'')===intelSort.category);
  if(intelSort.key) out.sort((a,b)=>{let A=a[intelSort.key],B=b[intelSort.key]; if(A==null)A=-Infinity;if(B==null)B=-Infinity; return intelSort.dir==='asc'?A-B:B-A});
  return out;
}
renderAgriIntelligence=function(q){const base=[...D.agriculture];const totalGen=D.stats.agriculture.generation_mt,totalSur=D.stats.agriculture.surplus_mt,totalUtil=D.stats.agriculture.utilized_mt,rate=totalSur/totalGen*100;$('intelKPIs').innerHTML=kpi('Biomass generation',`${totalGen.toFixed(2)} Mt/yr`)+kpi('Implied utilized',`${totalUtil.toFixed(2)} Mt/yr`)+kpi('Surplus / recovery potential',`${totalSur.toFixed(2)} Mt/yr`)+kpi('Overall surplus share',pct(rate));const top=[...base].sort((a,b)=>b.generation_mt-a.generation_mt).slice(0,10);if(intelChart)intelChart.destroy();intelChart=new Chart($('intelChart'),{type:'bar',data:{labels:top.map(r=>r.region),datasets:[{label:'Generation (Mt/yr)',data:top.map(r=>r.generation_mt)},{label:'Surplus (Mt/yr)',data:top.map(r=>r.surplus_mt)}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});$('intelChartTitle').textContent='Top agricultural biomass regions: generation vs surplus';$('intelTableTitle').textContent='Agricultural biomass regional data';$('intelHead').innerHTML='<tr>'+intelHeader('Region','region')+intelHeader('Generation Mt/yr','generation_mt')+intelHeader('Utilized Mt/yr','utilized_mt')+intelHeader('Surplus Mt/yr','surplus_mt')+intelHeader('Surplus %','surplus_rate')+intelHeader('Recovery Opportunity Index','opportunity_index')+intelHeader('Category','opportunity',true)+'</tr>';const rows=intelPrepare(base,q);$('intelTable').innerHTML=rows.map(r=>`<tr><td><b>${r.region}</b></td><td>${fmt(r.generation_mt)}</td><td>${fmt(r.utilized_mt)}</td><td>${fmt(r.surplus_mt)}</td><td>${pct(r.surplus_rate)}</td><td>${r.opportunity_index.toFixed(2)}</td><td><span class="badge ${r.opportunity.toLowerCase()}">${r.opportunity}</span></td></tr>`).join('')}
renderPlasticIntelligence=function(q){const latest=D.plastic_yearly.at(-1),y20=D.plastic_yearly.find(r=>r.year==='2020-21'),y21=D.plastic_yearly.find(r=>r.year==='2021-22');$('intelKPIs').innerHTML=kpi(`${latest.year} generation`,`${fmtM(latest.generated_tpa)} t`)+kpi('2020–21 reported processed',`${fmtM(y20.processed_tpa)} t`)+kpi('2021–22 reported processed',`${fmtM(y21.processed_tpa)} t`)+kpi('2021–22 processing rate',pct(y21.processing_rate));if(intelChart)intelChart.destroy();intelChart=new Chart($('intelChart'),{type:'line',data:{labels:D.plastic_yearly.map(r=>r.year),datasets:[{label:'Plastic generated (TPA)',data:D.plastic_yearly.map(r=>r.generated_tpa),tension:.25}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});$('intelChartTitle').textContent='Plastic waste generation trend, 2018–19 to 2022–23';$('intelTableTitle').textContent='Plastic state/UT analytical summary';$('intelHead').innerHTML='<tr>'+intelHeader('Region','region')+intelHeader('5-year avg generation TPA','avg_generation_tpa')+intelHeader('Avg reported processed TPA*','avg_processed_tpa')+intelHeader('Recovery gap context','recovery_gap_fraction')+intelHeader('Recovery Opportunity Index','opportunity_index')+intelHeader('Category','opportunity',true)+'</tr>';const rows=intelPrepare([...D.plastic],q);$('intelTable').innerHTML=rows.map(r=>`<tr><td><b>${r.region}</b></td><td>${fmt(r.avg_generation_tpa)}</td><td>${r.avg_processed_tpa==null?'Not standardized':fmt(r.avg_processed_tpa)}</td><td>${pct(r.recovery_gap_fraction*100)}</td><td>${r.opportunity_index.toFixed(2)}</td><td><span class="badge ${r.opportunity.toLowerCase()}">${r.opportunity}</span></td></tr>`).join('')}
renderEwasteIntelligence=function(q){const e=latestE();$('intelKPIs').innerHTML=kpi(`${e.year} generated`,`${fmt(e.generated_t)} t`)+kpi(`${e.year} processed`,`${fmt(e.processed_t)} t`)+kpi('Processing rate',pct(e.processing_rate))+kpi('Unrecovered gap',`${fmt(e.gap_t)} t`);if(intelChart)intelChart.destroy();intelChart=new Chart($('intelChart'),{type:'line',data:{labels:D.ewaste.map(r=>r.year),datasets:[{label:'Generated (t)',data:D.ewaste.map(r=>r.generated_t)},{label:'Processed (t)',data:D.ewaste.map(r=>r.processed_t)}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});$('intelChartTitle').textContent='E-waste generated vs processed';$('intelTableTitle').textContent='National e-waste annual data';$('intelHead').innerHTML='<tr>'+intelHeader('Year','year')+intelHeader('Generated t','generated_t')+intelHeader('Processed t','processed_t')+intelHeader('Processing rate','processing_rate')+intelHeader('Gap t','gap_t')+intelHeader('Authorized recyclers','recyclers')+intelHeader('Capacity TPA','capacity_tpa')+intelHeader('Recovery Opportunity Index','opportunity_index')+'</tr>';let rows=[...D.ewaste].filter(r=>r.year.toLowerCase().includes(q));if(intelSort.key)rows.sort((a,b)=>intelSort.dir==='asc'?(a[intelSort.key]??0)-(b[intelSort.key]??0):(b[intelSort.key]??0)-(a[intelSort.key]??0));$('intelTable').innerHTML=rows.map(r=>`<tr><td><b>${r.year}</b></td><td>${fmt(r.generated_t)}</td><td>${fmt(r.processed_t)}</td><td>${pct(r.processing_rate)}</td><td>${fmt(r.gap_t)}</td><td>${fmt(r.recyclers)}</td><td>${fmt(r.capacity_tpa)}</td><td>${r.opportunity_index.toFixed(2)}</td></tr>`).join('')}

function roleSectorAdvice(role,sec,sub,region){
 const s={
  Farmer:{agriculture:`For a farmer handling ${sub}, focus on safe residue collection, segregation, drying/baling where needed, and a nearby aggregator or biomass procurement route. Confirm specifications before transport.`,plastic:`For farm-generated ${sub}, segregate it from organic residue and route it to a compatible recycler/collection channel; do not burn or mix it with biomass.`,ewaste:`For farm/household ${sub}, keep equipment intact and use an authorized e-waste collection/recycling route.`},
  Industry:{agriculture:`For industry, treat ${sub} as a potential secondary feedstock/fuel only after checking quality, moisture, continuity of supply, preprocessing and logistics.`,plastic:`For industry, use the ${sub} recovery-gap context to assess sourcing/recycling potential, then verify polymer grade, contamination, volume and recycler capability.`,ewaste:`For industry, route ${sub} through authorized e-waste channels and maintain applicable records; evaluate refurbishment/recovery before final recycling.`},
  Government:{agriculture:`For government/local authorities, use ${region}'s biomass surplus and CRROM as a prioritization signal for aggregation, preprocessing, market linkage and infrastructure assessment—not as a buyer recommendation.`,plastic:`For government/local authorities, use ${region}'s generation, recovery gap and CRROM to identify collection/processing gaps and where deeper infrastructure assessment may be justified.`,ewaste:`For government/local authorities, the current e-waste model is national rather than state-level. Use annual generation, processing, capacity and recycler trends for planning; do not infer a state ranking from this dataset.`},
  Researcher:{agriculture:`For research, analyse generation, implied utilization, surplus rate, CRROM and K-Means profile separately and retain the baseline/proxy limitations.`,plastic:`For research, distinguish five-year generation from the standardized management-year recovery variables; CRROM and clusters are analytical prioritization outputs.`,ewaste:`For research, treat e-waste as a five-year national temporal series. CRROM is calculated annually and K-Means is intentionally not applied to only five observations.`}
 }; return s[role]?.[sec]||'Use the available indicators as decision support.';
}

renderActionResult=function(r){
 const roleText=roleSectorAdvice(r.role,r.sectorKey,r.subtype,r.region); const prep=preparationAdvice(r.sectorKey,r.subtype),comp=complianceAdvice(r.sectorKey);
 const showContacts=['Farmer','Industry'].includes(r.role); const local=r.contacts.filter(c=>c.state===r.region); const other=r.contacts.filter(c=>c.state!==r.region);
 const contactBlock=!showContacts?`<div class="gov-research-note"><b>No buyer/vendor directory shown for ${escapeHtml(r.role)}.</b><p>This role receives planning/research guidance instead of commercial contacts.</p></div>`:
   `${local.length?`<h5>Matches in selected state/region (${local.length})</h5><div class="contact-grid">${local.map(contactCard).join('')}</div>`:'<p><b>No verified local match is stored for this selection.</b></p>'}${other.length?`<details class="national-contacts"><summary>Additional verified contacts outside selected region (${other.length})</summary><div class="contact-grid">${other.map(contactCard).join('')}</div></details>`:''}`;
 r.roleAdvice=roleText;r.preparation=prep;r.compliance=comp;sessionStorage.setItem('cri_last_action',JSON.stringify(r));
 $('actionResult').className='result-card';$('actionResult').innerHTML=`<div class="result-top"><div><span class="topic-tag">${escapeHtml(r.role.toUpperCase())} • ${escapeHtml(r.sector.toUpperCase())}</span><h2>${escapeHtml(r.subtype)}</h2><p>${escapeHtml(r.region)} • ${r.quantity.toFixed(2)} tonnes</p><span class="badge ${r.opportunity.toLowerCase()}">${r.opportunity} regional opportunity</span></div><div class="score-mini"><small>Supporting Recovery Opportunity Index</small><strong>${r.index.toFixed(1)}</strong><small>CRROM • not recovery %</small></div></div>
 <div class="action-metrics"><div><small>Your input quantity</small><strong>${r.quantity.toFixed(2)} t</strong></div><div><small>${r.recoveryLabel}</small><strong>${r.recoveryQuantity.toFixed(2)} t</strong></div><div><small>Account status</small><strong>Prototype</strong></div></div>
 <div class="role-advice"><small>${escapeHtml(r.role.toUpperCase())} • ${escapeHtml(r.sector.toUpperCase())} DECISION SUPPORT</small><p>${escapeHtml(roleText)}</p></div>
 <div class="action-section"><h4>1. Recovery context</h4><p>${escapeHtml(r.basis)} This is contextual decision support, not a technical recovery guarantee.</p></div>
 <div class="action-section"><h4>2. Suitable pathway</h4><div class="pathways">${r.pathways.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div><div class="prep-box"><h5>Preparation / handling</h5><p>${escapeHtml(prep)}</p></div></div>
 <div class="action-section"><h4>3. ${showContacts?'Relevant verified contact routes':'Role-specific planning output'}</h4>${contactBlock}</div>
 <div class="action-section"><h4>4. Compliance / verification</h4><div class="compliance-box"><p>${escapeHtml(comp)}</p></div></div>
 <div class="action-section"><h4>5. Recommended next action</h4><p>${showContacts?'Confirm current acceptance, specifications, quantity, commercial terms and logistics directly with a relevant contact before dispatch.':'Use the identified indicators to prioritize deeper assessment, comparison and evidence-based planning; do not interpret CRROM as a recovery percentage or a sanctioning rule.'}</p></div>
 <button class="btn primary" onclick="downloadActionPDF()">Download Action Report</button>`;
};

// Authentication is explicitly a prototype account, not identity verification.
updateActionUserStatus=function(){const el=$('actionUserStatus');if(!el)return;const u=getAuthSession();el.innerHTML=u?`✓ Prototype account: <b>${escapeHtml(u.name)}</b> • ${escapeHtml(u.role)} <span class="unverified-pill">Identity not externally verified</span>`:'🔒 Prototype login/sign-up is required before generating an Action Plan. Identity is not externally verified.'};
updateActionUserStatus();

// ============================================================================
// FINAL ROLE LOGIC + FULL-PAGE LANGUAGE PATCH (20 Sep 2026)
// ============================================================================
const CRI_UI_TRANSLATIONS={
hi:{
'Circular Resource Intelligence':'सर्कुलर रिसोर्स इंटेलिजेंस','Primary outputs are real quantities and recovery gaps. CRROM is secondary.':'मुख्य परिणाम वास्तविक मात्राएँ और रिकवरी अंतर हैं। CRROM एक सहायक सूचकांक है।','Current evidence-based insights':'वर्तमान साक्ष्य-आधारित अंतर्दृष्टियाँ','Quick access':'त्वरित पहुँच','Resource Recovery Snapshot':'संसाधन रिकवरी सारांश','Agricultural biomass generation • baseline Mt/year':'कृषि बायोमास उत्पादन • आधाररेखा Mt/वर्ष','Plastic generation • avg across modelled regions':'प्लास्टिक उत्पादन • मॉडल किए गए क्षेत्रों का औसत','E-waste generated • 5-year national average':'ई-कचरा उत्पादन • 5-वर्षीय राष्ट्रीय औसत','Recovery Opportunity Index (CRROM) is kept as a supporting prioritization metric—not confused with recycling or recovery percentage.':'रिकवरी अवसर सूचकांक (CRROM) केवल सहायक प्राथमिकता सूचक है; यह रीसाइक्लिंग या रिकवरी प्रतिशत नहीं है।','Average state/region biomass generation in the available baseline.':'उपलब्ध आधाररेखा में राज्य/क्षेत्र का औसत बायोमास उत्पादन।','Average state/UT generation across the five-year analytical series.':'पाँच-वर्षीय विश्लेषण श्रृंखला में राज्य/केंद्रशासित प्रदेश का औसत उत्पादन।','Five-year average national e-waste generation (2018–19 to 2022–23).':'राष्ट्रीय ई-कचरा उत्पादन का पाँच-वर्षीय औसत (2018–19 से 2022–23)।','Latest national state-sum':'नवीनतम राष्ट्रीय राज्य-योग','2022–23 processing rate':'2022–23 प्रसंस्करण दर','India/region total baseline':'भारत/क्षेत्र कुल आधाररेखा',
'MODULE 1':'मॉड्यूल 1','MODULE 2':'मॉड्यूल 2','MODULE 3 • CORE USP':'मॉड्यूल 3 • मुख्य विशेषता','COMPARE':'तुलना','KNOWLEDGE HUB':'ज्ञान केंद्र','PROFILE':'प्रोफ़ाइल','Regional / yearly data':'क्षेत्रीय / वार्षिक डेटा','What the index means':'सूचकांक का अर्थ','Search...':'खोजें...','Map layer':'मानचित्र परत','Interpretation:':'व्याख्या:','Recovery Opportunity (CRROM):':'रिकवरी अवसर (CRROM):','High':'उच्च','Medium':'मध्यम','Low':'निम्न',
'Action Center':'एक्शन सेंटर','Specify what waste you actually have. The platform combines waste subtype, location, recovery-gap context and a verified resource-utilizer directory to suggest the next action.':'अपनी भूमिका और कचरे का प्रकार चुनें। प्लेटफ़ॉर्म उपलब्ध डेटा के आधार पर भूमिका-विशिष्ट अगली कार्रवाई सुझाता है।','Analyze your waste':'अपना विश्लेषण करें','User role':'उपयोगकर्ता भूमिका','Waste type':'कचरे का प्रकार','Waste subtype':'कचरे का उप-प्रकार','State / Region':'राज्य / क्षेत्र','Waste quantity (tonnes)':'कचरे की मात्रा (टन)','Optional local market value (₹ / tonne)':'वैकल्पिक स्थानीय बाजार मूल्य (₹ / टन)','Generate Action Plan':'एक्शन प्लान बनाएं','The platform does not invent market prices. Company cards show only name, location and available contact route.':'प्लेटफ़ॉर्म बाजार मूल्य नहीं गढ़ता। संपर्क कार्ड में केवल उपलब्ध सत्यापित संपर्क जानकारी दिखाई जाती है।','Your action plan will appear here':'आपका एक्शन प्लान यहाँ दिखाई देगा','Actual/contextual quantity • recovery gap • recommended pathway • suitable contacts • supporting opportunity index':'भूमिका-उपयुक्त संकेतक • रिकवरी अंतर • अनुशंसित मार्ग • सहायक अवसर सूचकांक',
'Identify the exact waste and quantity.':'कचरे की सही श्रेणी और आवश्यक विवरण पहचानें।','Place it in the available regional context.':'इसे उपलब्ध क्षेत्रीय संदर्भ में रखें।','Use recovery gap + CRROM as supporting intelligence.':'रिकवरी अंतर + CRROM को सहायक जानकारी की तरह उपयोग करें।','Choose a pathway, prepare material and contact a suitable resource user.':'उपयुक्त कार्रवाई/मार्ग चुनें और जहाँ लागू हो वहाँ संबंधित संपर्क देखें।',
'Region Comparison':'क्षेत्र तुलना','Compare actual waste and recovery indicators first. The opportunity index is shown only as an additional decision signal.':'पहले वास्तविक कचरा और रिकवरी संकेतकों की तुलना करें। अवसर सूचकांक केवल अतिरिक्त निर्णय संकेत है।','Policies & circular pathways':'नीतियाँ और सर्कुलर मार्ग','Use official portals for current regulatory requirements and procurement conditions.':'वर्तमान नियामक आवश्यकताओं और खरीद शर्तों के लिए आधिकारिक पोर्टल का उपयोग करें।','Decision flow':'निर्णय प्रवाह','Prototype boundary / future scope':'प्रोटोटाइप सीमा / भविष्य का दायरा','Your workspace':'आपका कार्यक्षेत्र','Prototype profile and saved analyses are stored only in this browser.':'प्रोटोटाइप प्रोफ़ाइल और सहेजे गए विश्लेषण केवल इस ब्राउज़र में संग्रहीत हैं।','User profile':'उपयोगकर्ता प्रोफ़ाइल','Saved analysis history':'सहेजा गया विश्लेषण इतिहास','Clear':'साफ़ करें','Change role / name':'भूमिका / नाम बदलें'
},
mr:{
'Circular Resource Intelligence':'सर्क्युलर रिसोर्स इंटेलिजन्स','Primary outputs are real quantities and recovery gaps. CRROM is secondary.':'मुख्य निष्कर्ष वास्तविक प्रमाण आणि पुनर्प्राप्तीतील तफावत आहेत. CRROM हा सहाय्यक निर्देशांक आहे.','Current evidence-based insights':'सध्याचे पुरावा-आधारित निष्कर्ष','Quick access':'त्वरित प्रवेश','Resource Recovery Snapshot':'संसाधन पुनर्प्राप्ती सारांश','Agricultural biomass generation • baseline Mt/year':'कृषी बायोमास निर्मिती • आधाररेषा Mt/वर्ष','Plastic generation • avg across modelled regions':'प्लास्टिक निर्मिती • मॉडेल केलेल्या प्रदेशांची सरासरी','E-waste generated • 5-year national average':'ई-कचरा निर्मिती • 5 वर्षांची राष्ट्रीय सरासरी','Recovery Opportunity Index (CRROM) is kept as a supporting prioritization metric—not confused with recycling or recovery percentage.':'रिकव्हरी ऑपर्च्युनिटी इंडेक्स (CRROM) हा फक्त सहाय्यक प्राधान्य निर्देशांक आहे; तो पुनर्वापर किंवा पुनर्प्राप्ती टक्केवारी नाही.','Average state/region biomass generation in the available baseline.':'उपलब्ध आधाररेषेतील राज्य/प्रदेशाची सरासरी बायोमास निर्मिती.','Average state/UT generation across the five-year analytical series.':'पाच वर्षांच्या विश्लेषण मालिकेतील राज्य/केंद्रशासित प्रदेशाची सरासरी निर्मिती.','Five-year average national e-waste generation (2018–19 to 2022–23).':'राष्ट्रीय ई-कचरा निर्मितीची पाच वर्षांची सरासरी (2018–19 ते 2022–23).','Latest national state-sum':'नवीनतम राष्ट्रीय राज्य-बेरीज','2022–23 processing rate':'2022–23 प्रक्रिया दर','India/region total baseline':'भारत/प्रदेश एकूण आधाररेषा',
'MODULE 1':'मॉड्यूल 1','MODULE 2':'मॉड्यूल 2','MODULE 3 • CORE USP':'मॉड्यूल 3 • मुख्य वैशिष्ट्य','COMPARE':'तुलना','KNOWLEDGE HUB':'ज्ञान केंद्र','PROFILE':'प्रोफाइल','Regional / yearly data':'प्रादेशिक / वार्षिक डेटा','What the index means':'निर्देशांकाचा अर्थ','Search...':'शोधा...','Map layer':'नकाशा स्तर','Interpretation:':'अर्थ:','Recovery Opportunity (CRROM):':'पुनर्प्राप्ती संधी (CRROM):','High':'उच्च','Medium':'मध्यम','Low':'कमी',
'Action Center':'कृती केंद्र','Specify what waste you actually have. The platform combines waste subtype, location, recovery-gap context and a verified resource-utilizer directory to suggest the next action.':'आपली भूमिका आणि कचऱ्याचा प्रकार निवडा. उपलब्ध डेटावर आधारित भूमिका-विशिष्ट पुढील कृती प्लॅटफॉर्म सुचवतो.','Analyze your waste':'आपले विश्लेषण करा','User role':'वापरकर्ता भूमिका','Waste type':'कचऱ्याचा प्रकार','Waste subtype':'कचऱ्याचा उपप्रकार','State / Region':'राज्य / प्रदेश','Waste quantity (tonnes)':'कचऱ्याचे प्रमाण (टन)','Optional local market value (₹ / tonne)':'पर्यायी स्थानिक बाजार मूल्य (₹ / टन)','Generate Action Plan':'कृती आराखडा तयार करा','The platform does not invent market prices. Company cards show only name, location and available contact route.':'प्लॅटफॉर्म बाजारभाव तयार करत नाही. संपर्क कार्डमध्ये फक्त उपलब्ध पडताळलेली संपर्क माहिती दिसते.','Your action plan will appear here':'आपला कृती आराखडा येथे दिसेल','Actual/contextual quantity • recovery gap • recommended pathway • suitable contacts • supporting opportunity index':'भूमिका-योग्य निर्देशक • पुनर्प्राप्ती तफावत • शिफारस केलेला मार्ग • सहाय्यक संधी निर्देशांक',
'Identify the exact waste and quantity.':'कचऱ्याची अचूक श्रेणी आणि आवश्यक तपशील ओळखा.','Place it in the available regional context.':'उपलब्ध प्रादेशिक संदर्भात त्याचे स्थान ठरवा.','Use recovery gap + CRROM as supporting intelligence.':'पुनर्प्राप्ती तफावत + CRROM सहाय्यक माहिती म्हणून वापरा.','Choose a pathway, prepare material and contact a suitable resource user.':'योग्य कृती/मार्ग निवडा आणि लागू असल्यास संबंधित संपर्क पहा.','Region Comparison':'प्रदेश तुलना','Compare actual waste and recovery indicators first. The opportunity index is shown only as an additional decision signal.':'प्रथम वास्तविक कचरा आणि पुनर्प्राप्ती निर्देशकांची तुलना करा. संधी निर्देशांक हा फक्त अतिरिक्त निर्णय संकेत आहे.','Policies & circular pathways':'धोरणे आणि सर्क्युलर मार्ग','Use official portals for current regulatory requirements and procurement conditions.':'सध्याच्या नियामक आवश्यकता आणि खरेदी अटींसाठी अधिकृत पोर्टल वापरा.','Decision flow':'निर्णय प्रवाह','Prototype boundary / future scope':'प्रोटोटाइप मर्यादा / भविष्यातील व्याप्ती','Your workspace':'आपले कार्यक्षेत्र','Prototype profile and saved analyses are stored only in this browser.':'प्रोटोटाइप प्रोफाइल आणि जतन केलेले विश्लेषण फक्त या ब्राउझरमध्ये साठवले जातात.','User profile':'वापरकर्ता प्रोफाइल','Saved analysis history':'जतन केलेला विश्लेषण इतिहास','Clear':'साफ करा','Change role / name':'भूमिका / नाव बदला'
}};
Object.keys(CRI_UI_TRANSLATIONS).forEach(lang=>Object.assign(CRI_TRANSLATIONS[lang],CRI_UI_TRANSLATIONS[lang]));

function setActionRoleUI(){
 const role=$('actionRole')?.value||getAuthSession()?.role||'Farmer';
 const qty=$('actionQty')?.closest('label'), price=$('actionPrice')?.closest('label');
 const marketNote=$('actionPrice')?.closest('label')?.nextElementSibling;
 const operational=['Farmer','Industry'].includes(role);
 if(qty) qty.style.display=operational?'':'none';
 if(price) price.style.display=role==='Farmer'?'':'none';
 if(marketNote) marketNote.style.display=role==='Farmer'?'':'none';
 if($('actionQty')&&operational&&(!$('actionQty').value||+$('actionQty').value<=0)) $('actionQty').value=10;
}
$('actionRole')?.addEventListener('change',setActionRoleUI);
const _roleSetupAction=setupAction; setupAction=function(preselect){_roleSetupAction(preselect);setActionRoleUI();};

runActionAnalysis=function(){
 if(!isAuthenticated()){openAuthModal('action');return}
 const sec=$('actionSector').value,sub=$('actionSubtype').value,region=$('actionRegion').value,role=$('actionRole').value;
 const operational=['Farmer','Industry'].includes(role);
 const qty=operational?parseFloat($('actionQty').value):1;
 const price=role==='Farmer'?parseFloat($('actionPrice').value):NaN;
 if(operational&&(!qty||qty<=0)){alert(tr('Enter a valid waste quantity.'));return}
 const rc=recoveryContext(sec,region,qty),contacts=contactMatches(sec,sub,region),value=Number.isFinite(price)?rc.value*price:null;
 const result={timestamp:new Date().toLocaleString(),role,sector:sectorLabel[sec],sectorKey:sec,subtype:sub,region,quantity:operational?qty:null,recoveryQuantity:operational?rc.value:null,recoveryLabel:rc.label,basis:rc.basis,index:rc.index,opportunity:rc.opp,value,contacts,pathways:pathwayDetail(sec,sub)};
 sessionStorage.setItem('cri_last_action',JSON.stringify(result));saveHistory(result);renderActionResult(result);
};

function roleResultLabels(lang){return lang==='hi'?{context:'क्षेत्रीय संदर्भ',path:'प्रासंगिक मार्ग / हस्तक्षेप',output:'भूमिका-विशिष्ट परिणाम',next:'अगली अनुशंसित कार्रवाई',idx:'सहायक रिकवरी अवसर सूचकांक',notpct:'CRROM • रिकवरी % नहीं',opp:'क्षेत्रीय अवसर',noContacts:'इस भूमिका के लिए खरीदार/विक्रेता निर्देशिका नहीं दिखाई जाती।',planning:'यह भूमिका वाणिज्यिक संपर्कों के बजाय योजना/अनुसंधान संकेतक प्राप्त करती है।',contacts:'प्रासंगिक सत्यापित संपर्क मार्ग',local:'चयनित राज्य/क्षेत्र में मिलान',outside:'चयनित क्षेत्र के बाहर अतिरिक्त सत्यापित संपर्क',prototype:'प्रोटोटाइप'}:lang==='mr'?{context:'प्रादेशिक संदर्भ',path:'संबंधित मार्ग / हस्तक्षेप',output:'भूमिका-विशिष्ट निष्कर्ष',next:'पुढील शिफारस केलेली कृती',idx:'सहाय्यक पुनर्प्राप्ती संधी निर्देशांक',notpct:'CRROM • पुनर्प्राप्ती % नाही',opp:'प्रादेशिक संधी',noContacts:'या भूमिकेसाठी खरेदीदार/विक्रेता निर्देशिका दाखवली जात नाही.',planning:'या भूमिकेला व्यावसायिक संपर्कांऐवजी नियोजन/संशोधन निर्देशक मिळतात.',contacts:'संबंधित पडताळलेले संपर्क मार्ग',local:'निवडलेल्या राज्य/प्रदेशातील जुळणारे संपर्क',outside:'निवडलेल्या प्रदेशाबाहेरील अतिरिक्त पडताळलेले संपर्क',prototype:'प्रोटोटाइप'}:{context:'Regional context',path:'Relevant pathway / intervention',output:'Role-specific output',next:'Recommended next action',idx:'Supporting Recovery Opportunity Index',notpct:'CRROM • not recovery %',opp:'regional opportunity',noContacts:'No buyer/vendor directory is shown for this role.',planning:'This role receives planning/research indicators instead of commercial contacts.',contacts:'Relevant verified contact routes',local:'Matches in selected state/region',outside:'Additional verified contacts outside selected region',prototype:'Prototype'};}

renderActionResult=function(r){
 const L=roleResultLabels(currentLanguage()), roleText=roleSectorAdvice(r.role,r.sectorKey,r.subtype,r.region), prep=preparationAdvice(r.sectorKey,r.subtype), comp=complianceAdvice(r.sectorKey);
 // Contacts are useful to material holders seeking an outlet. Industry/Government/Researcher are not shown a misleading peer-industry directory.
 const showContacts=r.role==='Farmer'; const local=r.contacts.filter(c=>c.state===r.region),other=r.contacts.filter(c=>c.state!==r.region);
 const contactBlock=!showContacts?`<div class="gov-research-note"><b>${L.noContacts}</b><p>${L.planning}</p></div>`:`${local.length?`<h5>${L.local} (${local.length})</h5><div class="contact-grid">${local.map(contactCard).join('')}</div>`:'<p><b>No verified local match is stored for this selection.</b></p>'}${other.length?`<details class="national-contacts"><summary>${L.outside} (${other.length})</summary><div class="contact-grid">${other.map(contactCard).join('')}</div></details>`:''}`;
 const operational=r.quantity!==null;
 r.roleAdvice=roleText;r.preparation=prep;r.compliance=comp;sessionStorage.setItem('cri_last_action',JSON.stringify(r));
 $('actionResult').className='result-card'; $('actionResult').innerHTML=`<div class="result-top"><div><span class="topic-tag">${escapeHtml(r.role.toUpperCase())} • ${escapeHtml(r.sector.toUpperCase())}</span><h2>${escapeHtml(r.subtype)}</h2><p>${escapeHtml(r.region)}${operational?' • '+r.quantity.toFixed(2)+' tonnes':''}</p><span class="badge ${r.opportunity.toLowerCase()}">${escapeHtml(r.opportunity)} ${L.opp}</span></div><div class="score-mini"><small>${L.idx}</small><strong>${r.index.toFixed(1)}</strong><small>${L.notpct}</small></div></div>
 ${operational?`<div class="action-metrics"><div><small>${tr('Waste quantity (tonnes)')}</small><strong>${r.quantity.toFixed(2)} t</strong></div><div><small>${escapeHtml(r.recoveryLabel)}</small><strong>${r.recoveryQuantity.toFixed(2)} t</strong></div><div><small>Account status</small><strong>${L.prototype}</strong></div></div>`:''}
 <div class="role-advice"><small>${escapeHtml(r.role.toUpperCase())} • ${escapeHtml(r.sector.toUpperCase())}</small><p>${escapeHtml(roleText)}</p></div>
 <div class="action-section"><h4>1. ${L.context}</h4><p>${escapeHtml(r.basis)}</p></div>
 <div class="action-section"><h4>2. ${L.path}</h4><div class="pathways">${r.pathways.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>${['Farmer','Industry'].includes(r.role)?`<div class="prep-box"><h5>Preparation / handling</h5><p>${escapeHtml(prep)}</p></div>`:''}</div>
 <div class="action-section"><h4>3. ${r.role==='Farmer'?L.contacts:L.output}</h4>${contactBlock}</div>
 <div class="action-section"><h4>4. ${tr('Compliance & verification')}</h4><p>${escapeHtml(comp)}</p></div>
 <div class="action-section"><h4>5. ${L.next}</h4><p>${escapeHtml(roleText)}</p></div>
 <button class="btn primary" onclick="downloadActionPDF()">${tr('Download Action Report')}</button>`;
};

// Translate static UI after each language change AND re-render dynamic active module in that language.
const _patchedApplyLanguage=applyLanguage; applyLanguage=function(lang){
 _patchedApplyLanguage(lang);
 document.querySelectorAll('input[placeholder],option').forEach(el=>{if(el.placeholder&&CRI_TRANSLATIONS[lang]?.[el.placeholder])el.placeholder=CRI_TRANSLATIONS[lang][el.placeholder];});
 const active=document.querySelector('.page.active')?.id;
 if(active==='intelligence')renderIntelligence(); if(active==='action'){setActionRoleUI();const last=JSON.parse(sessionStorage.getItem('cri_last_action')||'null');if(last)renderActionResult(last);} if(active==='profile')renderProfile();
};
setActionRoleUI();

// ============================================================================
// COMPLETE LANGUAGE ENFORCEMENT PATCH — 20 Sep 2026
// All UI prose is localized; proper names, emails, URLs, numeric data and CRROM stay unchanged.
// ============================================================================
const CRI_COMPLETE_I18N={
hi:{
'Primary outputs are real quantities and recovery gaps. CRROM is secondary.':'मुख्य परिणाम वास्तविक मात्राएँ और रिकवरी अंतर हैं। CRROM सहायक सूचकांक है।','Resource Recovery Snapshot':'संसाधन रिकवरी सारांश','Current evidence-based insights':'वर्तमान साक्ष्य-आधारित अंतर्दृष्टियाँ','Quick access':'त्वरित पहुँच','Waste Intelligence':'वेस्ट इंटेलिजेंस','GIS Resource Map':'GIS संसाधन मानचित्र','Region Comparison':'क्षेत्र तुलना','Policies & circular pathways':'नीतियाँ और सर्कुलर मार्ग','Your workspace':'आपका कार्यक्षेत्र','Regional / yearly data':'क्षेत्रीय / वार्षिक डेटा','Search...':'खोजें...','What the index means':'सूचकांक का अर्थ','Map layer':'मानचित्र परत','Interpretation:':'व्याख्या:','Recovery Opportunity (CRROM):':'रिकवरी अवसर (CRROM):','High':'उच्च','Medium':'मध्यम','Low':'निम्न','All':'सभी','Sort':'क्रमबद्ध करें','High → Low':'उच्च → निम्न','Low → High':'निम्न → उच्च','Region':'क्षेत्र','Category':'श्रेणी','Year':'वर्ष','Processing rate':'प्रसंस्करण दर','Authorized recyclers':'अधिकृत रीसाइक्लर','Capacity TPA':'क्षमता TPA','Not standardized':'मानकीकृत नहीं','Biomass generation':'बायोमास उत्पादन','Implied utilized':'अनुमानित उपयोग','Surplus / recovery potential':'अधिशेष / रिकवरी क्षमता','Overall surplus share':'कुल अधिशेष हिस्सा','Generation (Mt/yr)':'उत्पादन (Mt/वर्ष)','Surplus (Mt/yr)':'अधिशेष (Mt/वर्ष)','Top agricultural biomass regions: generation vs surplus':'शीर्ष कृषि बायोमास क्षेत्र: उत्पादन बनाम अधिशेष','Agricultural biomass regional data':'कृषि बायोमास क्षेत्रीय डेटा','Plastic waste generation trend, 2018–19 to 2022–23':'प्लास्टिक कचरा उत्पादन प्रवृत्ति, 2018–19 से 2022–23','Plastic state/UT analytical summary':'प्लास्टिक राज्य/केंद्रशासित प्रदेश विश्लेषण सारांश','E-waste generated vs processed':'ई-कचरा: उत्पन्न बनाम प्रसंस्कृत','National e-waste annual data':'राष्ट्रीय ई-कचरा वार्षिक डेटा','Generated (t)':'उत्पन्न (टन)','Processed (t)':'प्रसंस्कृत (टन)','Unrecovered gap':'अप्राप्त रिकवरी अंतर','Analyze region':'क्षेत्र का विश्लेषण करें','Generation:':'उत्पादन:','Surplus:':'अधिशेष:','Surplus rate:':'अधिशेष दर:','5-year avg generation:':'5-वर्षीय औसत उत्पादन:','Recovery-gap context:':'रिकवरी-अंतर संदर्भ:','Recovery Opportunity Index:':'रिकवरी अवसर सूचकांक:',
'Action Center':'एक्शन सेंटर','Analyze your waste':'अपना विश्लेषण करें','User role':'उपयोगकर्ता भूमिका','Waste type':'कचरे का प्रकार','Waste subtype':'कचरे का उप-प्रकार','State / Region':'राज्य / क्षेत्र','Waste quantity (tonnes)':'कचरे की मात्रा (टन)','Optional local market value (₹ / tonne)':'वैकल्पिक स्थानीय बाजार मूल्य (₹ / टन)','Generate Action Plan':'एक्शन प्लान बनाएं','Your action plan will appear here':'आपका एक्शन प्लान यहाँ दिखाई देगा','Prototype':'प्रोटोटाइप','Account status':'खाता स्थिति','Identity not externally verified':'पहचान बाहरी रूप से सत्यापित नहीं है','Prototype account:':'प्रोटोटाइप खाता:','Prototype login/sign-up is required before generating an Action Plan. Identity is not externally verified.':'एक्शन प्लान बनाने से पहले प्रोटोटाइप लॉगिन/साइन-अप आवश्यक है। पहचान बाहरी रूप से सत्यापित नहीं है।','Enter a valid waste quantity.':'कृपया कचरे की वैध मात्रा दर्ज करें।','Regional context':'क्षेत्रीय संदर्भ','Relevant pathway / intervention':'प्रासंगिक मार्ग / हस्तक्षेप','Role-specific output':'भूमिका-विशिष्ट परिणाम','Recommended next action':'अगली अनुशंसित कार्रवाई','Supporting Recovery Opportunity Index':'सहायक रिकवरी अवसर सूचकांक','CRROM • not recovery %':'CRROM • रिकवरी % नहीं','regional opportunity':'क्षेत्रीय अवसर','Relevant verified contact routes':'प्रासंगिक सत्यापित संपर्क मार्ग','Matches in selected state/region':'चयनित राज्य/क्षेत्र में मिलान','Additional verified contacts outside selected region':'चयनित क्षेत्र के बाहर अतिरिक्त सत्यापित संपर्क','No verified local match is stored for this selection.':'इस चयन के लिए कोई सत्यापित स्थानीय मिलान उपलब्ध नहीं है।','No buyer/vendor directory is shown for this role.':'इस भूमिका के लिए खरीदार/विक्रेता निर्देशिका नहीं दिखाई जाती।','This role receives planning/research indicators instead of commercial contacts.':'इस भूमिका को व्यावसायिक संपर्कों के बजाय योजना/अनुसंधान संकेतक मिलते हैं।','Preparation / handling':'तैयारी / हैंडलिंग','Compliance & verification':'अनुपालन और सत्यापन','Download Action Report':'एक्शन रिपोर्ट डाउनलोड करें','Official / verified source':'आधिकारिक / सत्यापित स्रोत','Verified contact route':'सत्यापित संपर्क मार्ग','Example:':'उदाहरण:','Farmer':'किसान','Industry':'उद्योग','Government':'सरकार','Researcher':'शोधकर्ता','Agricultural Biomass':'कृषि बायोमास','Plastic Waste':'प्लास्टिक कचरा','E-Waste':'ई-कचरा',
'Compare':'तुलना','Waste type':'कचरे का प्रकार','Region / Year A':'क्षेत्र / वर्ष A','Region / Year B':'क्षेत्र / वर्ष B','E-Waste (year vs year)':'ई-कचरा (वर्ष बनाम वर्ष)','Use official portals for current regulatory requirements and procurement conditions.':'वर्तमान नियामक आवश्यकताओं और खरीद शर्तों के लिए आधिकारिक पोर्टल का उपयोग करें।','Biomass utilization':'बायोमास उपयोग','Plastic Waste Management':'प्लास्टिक कचरा प्रबंधन','Authorized e-waste recovery':'अधिकृत ई-कचरा रिकवरी','Decision flow':'निर्णय प्रवाह','Waste type':'कचरे का प्रकार','Subtype':'उप-प्रकार','Quantity & location':'मात्रा और स्थान','Recovery potential':'रिकवरी क्षमता','Utilization pathway':'उपयोग मार्ग','Preparation':'तैयारी','Suitable contact':'उपयुक्त संपर्क','Compliance':'अनुपालन','Action report':'एक्शन रिपोर्ट','Prototype boundary / future scope':'प्रोटोटाइप सीमा / भविष्य का दायरा','Live secondary-material prices':'लाइव द्वितीयक-सामग्री मूल्य','Real-time procurement confirmation':'रीयल-टाइम खरीद पुष्टि','Exact nationwide facility coordinates':'देशभर की सुविधाओं के सटीक निर्देशांक','Route & logistics optimization':'मार्ग और लॉजिस्टिक्स अनुकूलन','Production authentication/database':'उत्पादन-स्तरीय प्रमाणीकरण/डेटाबेस','Alerts, subscriptions & incentives':'अलर्ट, सदस्यता और प्रोत्साहन','User profile':'उपयोगकर्ता प्रोफ़ाइल','Saved analysis history':'सहेजा गया विश्लेषण इतिहास','Change role / name':'भूमिका / नाम बदलें','Clear':'साफ़ करें','ACCOUNT REQUIRED FOR ACTION PLANS':'एक्शन प्लान के लिए खाता आवश्यक','Login or create an account':'लॉगिन करें या खाता बनाएँ','This is a project-prototype account stored only in this browser. It is not production-grade authentication.':'यह परियोजना का प्रोटोटाइप खाता है जो केवल इस ब्राउज़र में संग्रहीत है। यह उत्पादन-स्तरीय प्रमाणीकरण नहीं है।','Login':'लॉगिन','Sign up':'साइन अप','Name':'नाम','Email':'ईमेल','Role':'भूमिका','Password':'पासवर्ड','Your name':'आपका नाम','Minimum 4 characters':'कम से कम 4 अक्षर','PERSONALISE YOUR EXPERIENCE':'अपना अनुभव अनुकूलित करें','How will you use CRI?':'आप CRI का उपयोग कैसे करेंगे?','Enter your name':'अपना नाम दर्ज करें','Biomass recovery & contacts':'बायोमास रिकवरी और संपर्क','Resource and processing opportunities':'संसाधन और प्रसंस्करण अवसर','Recovery gaps & priority regions':'रिकवरी अंतर और प्राथमिकता क्षेत्र','Indicators & comparative analysis':'संकेतक और तुलनात्मक विश्लेषण','Prototype access only; not a production authentication system.':'केवल प्रोटोटाइप पहुँच; यह उत्पादन प्रमाणीकरण प्रणाली नहीं है।'
},
mr:{
'Primary outputs are real quantities and recovery gaps. CRROM is secondary.':'मुख्य निष्कर्ष वास्तविक प्रमाण आणि पुनर्प्राप्तीतील तफावत आहेत. CRROM हा सहाय्यक निर्देशांक आहे.','Resource Recovery Snapshot':'संसाधन पुनर्प्राप्ती सारांश','Current evidence-based insights':'सध्याचे पुरावा-आधारित निष्कर्ष','Quick access':'त्वरित प्रवेश','Waste Intelligence':'कचरा बुद्धिमत्ता','GIS Resource Map':'GIS संसाधन नकाशा','Region Comparison':'प्रदेश तुलना','Policies & circular pathways':'धोरणे आणि सर्क्युलर मार्ग','Your workspace':'आपले कार्यक्षेत्र','Regional / yearly data':'प्रादेशिक / वार्षिक डेटा','Search...':'शोधा...','What the index means':'निर्देशांकाचा अर्थ','Map layer':'नकाशा स्तर','Interpretation:':'अर्थ:','Recovery Opportunity (CRROM):':'पुनर्प्राप्ती संधी (CRROM):','High':'उच्च','Medium':'मध्यम','Low':'कमी','All':'सर्व','Sort':'क्रमवारी','High → Low':'उच्च → कमी','Low → High':'कमी → उच्च','Region':'प्रदेश','Category':'श्रेणी','Year':'वर्ष','Processing rate':'प्रक्रिया दर','Authorized recyclers':'अधिकृत पुनर्वापरकर्ते','Capacity TPA':'क्षमता TPA','Not standardized':'प्रमाणित नाही','Biomass generation':'बायोमास निर्मिती','Implied utilized':'अंदाजित वापर','Surplus / recovery potential':'अधिशेष / पुनर्प्राप्ती क्षमता','Overall surplus share':'एकूण अधिशेष हिस्सा','Generation (Mt/yr)':'निर्मिती (Mt/वर्ष)','Surplus (Mt/yr)':'अधिशेष (Mt/वर्ष)','Top agricultural biomass regions: generation vs surplus':'शीर्ष कृषी बायोमास प्रदेश: निर्मिती विरुद्ध अधिशेष','Agricultural biomass regional data':'कृषी बायोमास प्रादेशिक डेटा','Plastic waste generation trend, 2018–19 to 2022–23':'प्लास्टिक कचरा निर्मिती प्रवृत्ती, 2018–19 ते 2022–23','Plastic state/UT analytical summary':'प्लास्टिक राज्य/केंद्रशासित प्रदेश विश्लेषण सारांश','E-waste generated vs processed':'ई-कचरा: निर्मित विरुद्ध प्रक्रिया','National e-waste annual data':'राष्ट्रीय ई-कचरा वार्षिक डेटा','Generated (t)':'निर्मित (टन)','Processed (t)':'प्रक्रिया केलेले (टन)','Unrecovered gap':'अपूर्ण पुनर्प्राप्ती तफावत','Analyze region':'प्रदेशाचे विश्लेषण करा','Generation:':'निर्मिती:','Surplus:':'अधिशेष:','Surplus rate:':'अधिशेष दर:','5-year avg generation:':'5-वर्षांची सरासरी निर्मिती:','Recovery-gap context:':'पुनर्प्राप्ती-तफावत संदर्भ:','Recovery Opportunity Index:':'पुनर्प्राप्ती संधी निर्देशांक:',
'Action Center':'कृती केंद्र','Analyze your waste':'आपले विश्लेषण करा','User role':'वापरकर्ता भूमिका','Waste type':'कचऱ्याचा प्रकार','Waste subtype':'कचऱ्याचा उपप्रकार','State / Region':'राज्य / प्रदेश','Waste quantity (tonnes)':'कचऱ्याचे प्रमाण (टन)','Optional local market value (₹ / tonne)':'पर्यायी स्थानिक बाजार मूल्य (₹ / टन)','Generate Action Plan':'कृती आराखडा तयार करा','Your action plan will appear here':'आपला कृती आराखडा येथे दिसेल','Prototype':'प्रोटोटाइप','Account status':'खाते स्थिती','Identity not externally verified':'ओळख बाह्यरित्या पडताळलेली नाही','Prototype account:':'प्रोटोटाइप खाते:','Prototype login/sign-up is required before generating an Action Plan. Identity is not externally verified.':'कृती आराखडा तयार करण्यापूर्वी प्रोटोटाइप लॉगिन/साइन-अप आवश्यक आहे. ओळख बाह्यरित्या पडताळलेली नाही.','Enter a valid waste quantity.':'कृपया कचऱ्याचे वैध प्रमाण प्रविष्ट करा.','Regional context':'प्रादेशिक संदर्भ','Relevant pathway / intervention':'संबंधित मार्ग / हस्तक्षेप','Role-specific output':'भूमिका-विशिष्ट निष्कर्ष','Recommended next action':'पुढील शिफारस केलेली कृती','Supporting Recovery Opportunity Index':'सहाय्यक पुनर्प्राप्ती संधी निर्देशांक','CRROM • not recovery %':'CRROM • पुनर्प्राप्ती % नाही','regional opportunity':'प्रादेशिक संधी','Relevant verified contact routes':'संबंधित पडताळलेले संपर्क मार्ग','Matches in selected state/region':'निवडलेल्या राज्य/प्रदेशातील जुळणारे संपर्क','Additional verified contacts outside selected region':'निवडलेल्या प्रदेशाबाहेरील अतिरिक्त पडताळलेले संपर्क','No verified local match is stored for this selection.':'या निवडीसाठी कोणताही पडताळलेला स्थानिक संपर्क उपलब्ध नाही.','No buyer/vendor directory is shown for this role.':'या भूमिकेसाठी खरेदीदार/विक्रेता निर्देशिका दाखवली जात नाही.','This role receives planning/research indicators instead of commercial contacts.':'या भूमिकेला व्यावसायिक संपर्कांऐवजी नियोजन/संशोधन निर्देशक मिळतात.','Preparation / handling':'तयारी / हाताळणी','Compliance & verification':'अनुपालन आणि पडताळणी','Download Action Report':'कृती अहवाल डाउनलोड करा','Official / verified source':'अधिकृत / पडताळलेला स्रोत','Verified contact route':'पडताळलेला संपर्क मार्ग','Example:':'उदाहरण:','Farmer':'शेतकरी','Industry':'उद्योग','Government':'शासन','Researcher':'संशोधक','Agricultural Biomass':'कृषी बायोमास','Plastic Waste':'प्लास्टिक कचरा','E-Waste':'ई-कचरा',
'Compare':'तुलना','Region / Year A':'प्रदेश / वर्ष A','Region / Year B':'प्रदेश / वर्ष B','E-Waste (year vs year)':'ई-कचरा (वर्ष विरुद्ध वर्ष)','Use official portals for current regulatory requirements and procurement conditions.':'सध्याच्या नियामक आवश्यकता आणि खरेदी अटींसाठी अधिकृत पोर्टल वापरा.','Biomass utilization':'बायोमास वापर','Plastic Waste Management':'प्लास्टिक कचरा व्यवस्थापन','Authorized e-waste recovery':'अधिकृत ई-कचरा पुनर्प्राप्ती','Decision flow':'निर्णय प्रवाह','Subtype':'उपप्रकार','Quantity & location':'प्रमाण आणि स्थान','Recovery potential':'पुनर्प्राप्ती क्षमता','Utilization pathway':'वापर मार्ग','Preparation':'तयारी','Suitable contact':'योग्य संपर्क','Compliance':'अनुपालन','Action report':'कृती अहवाल','Prototype boundary / future scope':'प्रोटोटाइप मर्यादा / भविष्यातील व्याप्ती','Live secondary-material prices':'थेट दुय्यम-साहित्य किंमती','Real-time procurement confirmation':'रिअल-टाइम खरेदी पुष्टी','Exact nationwide facility coordinates':'देशभरातील सुविधांचे अचूक निर्देशांक','Route & logistics optimization':'मार्ग आणि लॉजिस्टिक्स अनुकूलन','Production authentication/database':'उत्पादन-स्तरीय प्रमाणीकरण/डेटाबेस','Alerts, subscriptions & incentives':'सूचना, सदस्यता आणि प्रोत्साहने','User profile':'वापरकर्ता प्रोफाइल','Saved analysis history':'जतन केलेला विश्लेषण इतिहास','Change role / name':'भूमिका / नाव बदला','Clear':'साफ करा','ACCOUNT REQUIRED FOR ACTION PLANS':'कृती आराखड्यासाठी खाते आवश्यक','Login or create an account':'लॉगिन करा किंवा खाते तयार करा','This is a project-prototype account stored only in this browser. It is not production-grade authentication.':'हे प्रकल्पाचे प्रोटोटाइप खाते आहे आणि फक्त या ब्राउझरमध्ये साठवले जाते. हे उत्पादन-स्तरीय प्रमाणीकरण नाही.','Login':'लॉगिन','Sign up':'साइन अप','Name':'नाव','Email':'ईमेल','Role':'भूमिका','Password':'पासवर्ड','Your name':'आपले नाव','Minimum 4 characters':'किमान 4 अक्षरे','PERSONALISE YOUR EXPERIENCE':'आपला अनुभव सानुकूलित करा','How will you use CRI?':'आपण CRI कसा वापरणार?','Enter your name':'आपले नाव प्रविष्ट करा','Biomass recovery & contacts':'बायोमास पुनर्प्राप्ती आणि संपर्क','Resource and processing opportunities':'संसाधन आणि प्रक्रिया संधी','Recovery gaps & priority regions':'पुनर्प्राप्ती तफावत आणि प्राधान्य प्रदेश','Indicators & comparative analysis':'निर्देशक आणि तुलनात्मक विश्लेषण','Prototype access only; not a production authentication system.':'फक्त प्रोटोटाइप प्रवेश; ही उत्पादन प्रमाणीकरण प्रणाली नाही.'
}};
Object.keys(CRI_COMPLETE_I18N).forEach(l=>Object.assign(CRI_TRANSLATIONS[l],CRI_COMPLETE_I18N[l]));

function criRoleName(x){return tr(x)}
function criOpp(x){return currentLanguage()==='hi'?({High:'उच्च',Medium:'मध्यम',Low:'निम्न'}[x]||x):currentLanguage()==='mr'?({High:'उच्च',Medium:'मध्यम',Low:'कमी'}[x]||x):x}
function localizedPathways(sec){const l=currentLanguage();if(l==='en')return pathways(sec,'');if(l==='hi')return sec==='agriculture'?['एकत्रीकरण और बेलिंग','पैलेट / ब्रिकेट उत्पादन','बायोमास पावर को-फायरिंग','जहाँ उपयुक्त हो वहाँ बायो-CNG / अवायवीय पाचन']:sec==='plastic'?['सामग्री-विशिष्ट पृथक्करण','जहाँ उपयुक्त हो वहाँ यांत्रिक रीसाइक्लिंग','अधिकृत प्रसंस्करण मार्ग','रीसाइक्लर से व्यावसायिक शर्तों की पुष्टि']:['अधिकृत संग्रह','जहाँ संभव हो वहाँ नवीनीकरण','डिस्मैंटलिंग','अधिकृत रीसाइक्लिंग'];return sec==='agriculture'?['एकत्रीकरण आणि बेलिंग','पॅलेट / ब्रिकेट निर्मिती','बायोमास पॉवर को-फायरिंग','योग्य असल्यास बायो-CNG / अॅनारोबिक डायजेशन']:sec==='plastic'?['साहित्य-विशिष्ट वर्गीकरण','योग्य असल्यास यांत्रिक पुनर्वापर','अधिकृत प्रक्रिया मार्ग','पुनर्वापरकर्त्याशी व्यावसायिक अटींची पुष्टी']:['अधिकृत संकलन','शक्य असल्यास नूतनीकरण','विघटन','अधिकृत पुनर्वापर'];}
function localizedRecovery(sec,region,qty){const base=recoveryContext(sec,region,qty),l=currentLanguage();if(l==='en')return base;if(sec==='agriculture'){base.label=l==='hi'?'संदर्भित अधिशेष क्षमता':'संदर्भित अधिशेष क्षमता';base.basis=l==='hi'?`क्षेत्रीय बायोमास अधिशेष हिस्से (${pct(base.raw.surplus_rate)}) को संदर्भित रिकवरी संकेत के रूप में उपयोग किया गया है।`:`प्रादेशिक बायोमास अधिशेष हिस्सा (${pct(base.raw.surplus_rate)}) संदर्भित पुनर्प्राप्ती संकेत म्हणून वापरला आहे.`}else if(sec==='plastic'){base.label=l==='hi'?'संदर्भित अप्राप्त रिकवरी क्षमता':'संदर्भित अपूर्ण पुनर्प्राप्ती क्षमता';base.basis=l==='hi'?`तुलनीय प्रबंधन वर्षों के मॉडल किए गए औसत रिकवरी-अंतर (${pct(base.raw.recovery_gap_fraction*100)}) का उपयोग किया गया है।`:`तुलनीय व्यवस्थापन वर्षांतील मॉडेल केलेली सरासरी पुनर्प्राप्ती तफावत (${pct(base.raw.recovery_gap_fraction*100)}) वापरली आहे.`}else{base.label=l==='hi'?'संदर्भित अप्रसंस्कृत क्षमता':'संदर्भित अप्रक्रियित क्षमता';base.basis=l==='hi'?`अंतिम मॉडल में राज्य-स्तरीय ई-कचरा रिकवरी डेटा उपलब्ध नहीं है; इसलिए ${base.raw.year} के नवीनतम राष्ट्रीय प्रसंस्करण-अंतर संदर्भ का उपयोग किया गया है।`:`अंतिम मॉडेलमध्ये राज्यस्तरीय ई-कचरा पुनर्प्राप्ती डेटा उपलब्ध नाही; म्हणून ${base.raw.year} चा नवीनतम राष्ट्रीय प्रक्रिया-तफावत संदर्भ वापरला आहे.`}return base;}
function localizedRoleAdvice(role,sec,sub,region){const l=currentLanguage();if(l==='en')return roleSectorAdvice(role,sec,sub,region);const hi={Farmer:{agriculture:`किसान के रूप में ${sub} के लिए सुरक्षित संग्रह, पृथक्करण, आवश्यकता अनुसार सुखाने/बेलिंग और उपयुक्त बायोमास उपयोग मार्ग पर ध्यान दें। परिवहन से पहले विनिर्देशों की पुष्टि करें।`,plastic:`खेत से निकलने वाले ${sub} को जैविक अवशेष से अलग रखें और उपयुक्त रीसाइक्लिंग/संग्रह मार्ग में भेजें। इसे बायोमास के साथ न जलाएँ और न मिलाएँ।`,ewaste:`${sub} उपकरण को सुरक्षित और साबुत रखें तथा अधिकृत ई-कचरा संग्रह/रीसाइक्लिंग मार्ग का उपयोग करें।`},Industry:{agriculture:`उद्योग के लिए ${sub} को संभावित द्वितीयक फीडस्टॉक/ईंधन मानने से पहले गुणवत्ता, नमी, आपूर्ति निरंतरता, पूर्व-प्रसंस्करण और लॉजिस्टिक्स जाँचें।`,plastic:`उद्योग के लिए ${sub} के रिकवरी-अंतर संदर्भ से सोर्सिंग/रीसाइक्लिंग क्षमता का आकलन करें और पॉलिमर ग्रेड, संदूषण, मात्रा तथा रीसाइक्लिंग क्षमता सत्यापित करें।`,ewaste:`उद्योग के लिए ${sub} को अधिकृत ई-कचरा चैनलों से भेजें, लागू रिकॉर्ड रखें और अंतिम रीसाइक्लिंग से पहले नवीनीकरण/रिकवरी की संभावना देखें।`},Government:{agriculture:`सरकार/स्थानीय प्राधिकरण ${region} के बायोमास अधिशेष और CRROM का उपयोग एकत्रीकरण, पूर्व-प्रसंस्करण, बाजार संपर्क और अवसंरचना आकलन की प्राथमिकता के लिए करें—इसे खरीदार की सिफारिश न मानें।`,plastic:`सरकार/स्थानीय प्राधिकरण ${region} के उत्पादन, रिकवरी अंतर और CRROM से संग्रह/प्रसंस्करण की कमियाँ पहचानें और जहाँ आवश्यक हो वहाँ विस्तृत अवसंरचना आकलन करें।`,ewaste:`वर्तमान ई-कचरा मॉडल राज्य-स्तरीय नहीं बल्कि राष्ट्रीय है। योजना के लिए वार्षिक उत्पादन, प्रसंस्करण, क्षमता और रीसाइक्लर प्रवृत्तियों का उपयोग करें; इस डेटा से राज्य रैंकिंग न निकालें।`},Researcher:{agriculture:`अनुसंधान के लिए उत्पादन, अनुमानित उपयोग, अधिशेष दर, CRROM और K-Means प्रोफ़ाइल का अलग-अलग विश्लेषण करें तथा आधाररेखा/प्रॉक्सी सीमाएँ बनाए रखें।`,plastic:`अनुसंधान में पाँच-वर्षीय उत्पादन को मानकीकृत प्रबंधन-वर्ष रिकवरी चर से अलग रखें; CRROM और क्लस्टर विश्लेषणात्मक प्राथमिकता परिणाम हैं।`,ewaste:`ई-कचरे को पाँच-वर्षीय राष्ट्रीय समय-श्रृंखला के रूप में देखें। CRROM वार्षिक रूप से गणना किया गया है और केवल पाँच अवलोकनों के कारण K-Means जानबूझकर लागू नहीं किया गया।`}};const mr={Farmer:{agriculture:`शेतकरी म्हणून ${sub} साठी सुरक्षित संकलन, वर्गीकरण, गरजेनुसार वाळवणे/बेलिंग आणि योग्य बायोमास वापर मार्गावर लक्ष द्या. वाहतुकीपूर्वी तपशीलांची पुष्टी करा.`,plastic:`शेतीतून निर्माण होणारा ${sub} सेंद्रिय अवशेषापासून वेगळा ठेवा आणि योग्य पुनर्वापर/संकलन मार्गाने पाठवा. तो बायोमाससोबत जाळू किंवा मिसळू नका.`,ewaste:`${sub} उपकरण सुरक्षित आणि अखंड ठेवा व अधिकृत ई-कचरा संकलन/पुनर्वापर मार्ग वापरा.`},Industry:{agriculture:`उद्योगासाठी ${sub} दुय्यम फीडस्टॉक/इंधन म्हणून वापरण्यापूर्वी गुणवत्ता, आर्द्रता, पुरवठ्याची सातत्यता, पूर्वप्रक्रिया आणि लॉजिस्टिक्स तपासा.`,plastic:`उद्योगासाठी ${sub} च्या पुनर्प्राप्ती-तफावत संदर्भातून सोर्सिंग/पुनर्वापर क्षमता तपासा आणि पॉलिमर ग्रेड, दूषितपणा, प्रमाण व पुनर्वापर क्षमता पडताळा.`,ewaste:`उद्योगासाठी ${sub} अधिकृत ई-कचरा मार्गाने पाठवा, लागू नोंदी ठेवा आणि अंतिम पुनर्वापरापूर्वी नूतनीकरण/पुनर्प्राप्तीची शक्यता तपासा.`},Government:{agriculture:`शासन/स्थानिक प्राधिकरणांनी ${region} मधील बायोमास अधिशेष आणि CRROM चा वापर एकत्रीकरण, पूर्वप्रक्रिया, बाजार-जोडणी आणि पायाभूत सुविधा मूल्यांकनाच्या प्राधान्यासाठी करावा—याला खरेदीदार शिफारस समजू नये.`,plastic:`शासन/स्थानिक प्राधिकरणांनी ${region} मधील निर्मिती, पुनर्प्राप्ती तफावत आणि CRROM वापरून संकलन/प्रक्रिया उणिवा ओळखाव्यात आणि आवश्यक ठिकाणी सखोल पायाभूत सुविधा मूल्यांकन करावे.`,ewaste:`सध्याचे ई-कचरा मॉडेल राज्यस्तरीय नसून राष्ट्रीय आहे. नियोजनासाठी वार्षिक निर्मिती, प्रक्रिया, क्षमता आणि पुनर्वापरकर्ता प्रवृत्ती वापरा; या डेटावरून राज्य क्रमवारी काढू नका.`},Researcher:{agriculture:`संशोधनासाठी निर्मिती, अंदाजित वापर, अधिशेष दर, CRROM आणि K-Means प्रोफाइल स्वतंत्रपणे विश्लेषित करा आणि आधाररेषा/प्रॉक्सी मर्यादा लक्षात ठेवा.`,plastic:`संशोधनात पाच वर्षांची निर्मिती आणि प्रमाणित व्यवस्थापन-वर्ष पुनर्प्राप्ती चल वेगळे ठेवा; CRROM आणि क्लस्टर हे विश्लेषणात्मक प्राधान्य निष्कर्ष आहेत.`,ewaste:`ई-कचऱ्याला पाच वर्षांची राष्ट्रीय कालमालिका म्हणून पहा. CRROM वार्षिक गणला आहे आणि फक्त पाच निरीक्षणांमुळे K-Means जाणीवपूर्वक लागू केलेला नाही.`}};return (l==='hi'?hi:mr)[role]?.[sec]||'';}

// Final action engine: Government/Researcher never need quantity or price; Industry needs quantity but no peer-industry directory.
runActionAnalysis=function(){if(!isAuthenticated()){openAuthModal('action');return}const sec=$('actionSector').value,sub=$('actionSubtype').value,region=$('actionRegion').value,role=$('actionRole').value,operational=['Farmer','Industry'].includes(role),qty=operational?parseFloat($('actionQty').value):1,price=role==='Farmer'?parseFloat($('actionPrice').value):NaN;if(operational&&(!qty||qty<=0)){alert(tr('Enter a valid waste quantity.'));return}const rc=localizedRecovery(sec,region,qty),contacts=contactMatches(sec,sub,region),value=Number.isFinite(price)?rc.value*price:null,result={timestamp:new Date().toLocaleString(),role,sector:sectorLabel[sec],sectorKey:sec,subtype:sub,region,quantity:operational?qty:null,recoveryQuantity:operational?rc.value:null,recoveryLabel:rc.label,basis:rc.basis,index:rc.index,opportunity:rc.opp,value,contacts,pathways:localizedPathways(sec)};sessionStorage.setItem('cri_last_action',JSON.stringify(result));saveHistory(result);renderActionResult(result)};

renderActionResult=function(r){const l=currentLanguage(),L=roleResultLabels(l),roleText=localizedRoleAdvice(r.role,r.sectorKey,r.subtype,r.region),showContacts=r.role==='Farmer',local=r.contacts.filter(c=>c.state===r.region),other=r.contacts.filter(c=>c.state!==r.region),operational=r.quantity!==null;const noLocal=tr('No verified local match is stored for this selection.');const contactBlock=!showContacts?`<div class="gov-research-note"><b>${L.noContacts}</b><p>${L.planning}</p></div>`:`${local.length?`<h5>${L.local} (${local.length})</h5><div class="contact-grid">${local.map(contactCard).join('')}</div>`:`<p><b>${noLocal}</b></p>`}${other.length?`<details class="national-contacts"><summary>${L.outside} (${other.length})</summary><div class="contact-grid">${other.map(contactCard).join('')}</div></details>`:''}`;r.roleAdvice=roleText;sessionStorage.setItem('cri_last_action',JSON.stringify(r));$('actionResult').className='result-card';$('actionResult').innerHTML=`<div class="result-top"><div><span class="topic-tag">${escapeHtml(criRoleName(r.role).toUpperCase())} • ${escapeHtml(tr(r.sector).toUpperCase())}</span><h2>${escapeHtml(r.subtype)}</h2><p>${escapeHtml(r.region)}${operational?' • '+r.quantity.toFixed(2)+' t':''}</p><span class="badge ${r.opportunity.toLowerCase()}">${criOpp(r.opportunity)} ${L.opp}</span></div><div class="score-mini"><small>${L.idx}</small><strong>${r.index.toFixed(1)}</strong><small>${L.notpct}</small></div></div>${operational?`<div class="action-metrics"><div><small>${tr('Waste quantity (tonnes)')}</small><strong>${r.quantity.toFixed(2)} t</strong></div><div><small>${escapeHtml(r.recoveryLabel)}</small><strong>${r.recoveryQuantity.toFixed(2)} t</strong></div><div><small>${tr('Account status')}</small><strong>${tr('Prototype')}</strong></div></div>`:''}<div class="role-advice"><small>${escapeHtml(criRoleName(r.role).toUpperCase())} • ${escapeHtml(tr(r.sector).toUpperCase())}</small><p>${escapeHtml(roleText)}</p></div><div class="action-section"><h4>1. ${L.context}</h4><p>${escapeHtml(r.basis)}</p></div><div class="action-section"><h4>2. ${L.path}</h4><div class="pathways">${r.pathways.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div></div><div class="action-section"><h4>3. ${r.role==='Farmer'?L.contacts:L.output}</h4>${contactBlock}</div><div class="action-section"><h4>4. ${tr('Compliance & verification')}</h4><p>${l==='hi'?'किसी भी कार्रवाई से पहले लागू स्थानीय/क्षेत्रीय नियमों, सामग्री विनिर्देशों और अधिकृत प्रसंस्करण आवश्यकताओं की पुष्टि करें।':l==='mr'?'कोणतीही कृती करण्यापूर्वी लागू स्थानिक/क्षेत्रीय नियम, साहित्य तपशील आणि अधिकृत प्रक्रिया आवश्यकता पडताळा.':'Confirm applicable local/sector rules, material specifications and authorized processing requirements before action.'}</p></div><div class="action-section"><h4>5. ${L.next}</h4><p>${escapeHtml(roleText)}</p></div><button class="btn primary" onclick="downloadActionPDF()">${tr('Download Action Report')}</button>`;};

// Translate contact-card UI while preserving organization names and contact data.
contactCard=function(c){const cleanPhone=String(c.phone||'').split('/')[0].replace(/[^+\d]/g,''),phone=c.phone?`<a href="tel:${cleanPhone}">📞 ${escapeHtml(c.phone)}</a>`:'',email=c.email_or_contact&&String(c.email_or_contact).includes('@')?`<a href="mailto:${escapeHtml(c.email_or_contact)}">✉ ${escapeHtml(c.email_or_contact)}</a>`:'',source=c.contact_url?`<a class="source-link" href="${escapeHtml(c.contact_url)}" target="_blank" rel="noopener">🔗 ${tr('Official / verified source')}</a>`:'';return `<div class="contact-card"><h5>${escapeHtml(c.company)}</h5><span class="contact-type">${escapeHtml(c.internal_match_type||tr('Verified contact route'))}</span><p>📍 ${escapeHtml(c.city||'')}${c.city&&c.state?', ':''}${escapeHtml(c.state||'')}</p><div class="contact-actions">${phone}${email}</div>${source}</div>`};

function criTranslateDOM(root=document.body){const lang=currentLanguage();if(lang==='en')return;const map=CRI_TRANSLATIONS[lang]||{};const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);nodes.forEach(n=>{if(['SCRIPT','STYLE'].includes(n.parentElement?.tagName))return;const raw=n.nodeValue,trim=raw.trim();if(!trim)return;if(map[trim])n.nodeValue=raw.replace(trim,map[trim]);});document.querySelectorAll('input[placeholder]').forEach(e=>{const p=e.getAttribute('placeholder');if(map[p])e.setAttribute('placeholder',map[p])});document.querySelectorAll('option').forEach(e=>{const t=e.textContent.trim();if(map[t])e.textContent=map[t]});}
const criObs=new MutationObserver(()=>{clearTimeout(window.__criLangTimer);window.__criLangTimer=setTimeout(()=>criTranslateDOM(),0)});criObs.observe(document.body,{childList:true,subtree:true});
const _completeApply=applyLanguage;applyLanguage=function(lang){_completeApply(lang);setTimeout(()=>{criTranslateDOM();setActionRoleUI();const active=document.querySelector('.page.active')?.id;if(active==='action'){const last=JSON.parse(sessionStorage.getItem('cri_last_action')||'null');if(last)renderActionResult(last)}},0)};
applyLanguage(currentLanguage());


// GIS-ONLY REGIONAL ANALYSIS. Action Center code above is intentionally frozen.
function renderRegionAnalysis(sec, region){
  const box=$('regionAnalysis'); if(!box)return;
  const rows=sec==='agriculture'?D.agriculture:D.plastic;
  const r=rows.find(x=>x.region===region);
  if(!r){box.innerHTML='<h3>Regional Analysis</h3><p>No analytical record is available for this region.</p>';return;}
  let metrics='';
  if(sec==='agriculture'){
    metrics=`<tr><th>Biomass generation</th><td>${r.generation_mt.toFixed(2)} Mt/year</td></tr>
    <tr><th>Implied utilized</th><td>${r.utilized_mt.toFixed(2)} Mt/year</td></tr>
    <tr><th>Surplus / recovery potential</th><td>${r.surplus_mt.toFixed(2)} Mt/year</td></tr>
    <tr><th>Surplus share</th><td>${pct(r.surplus_rate)}</td></tr>
    <tr><th>Biomass-to-power potential</th><td>${fmt(r.power_potential_mwe)} MWe</td></tr>`;
  }else{
    metrics=`<tr><th>5-year average generation</th><td>${fmt(r.avg_generation_tpa)} TPA</td></tr>
    <tr><th>Average processed (comparable data)</th><td>${fmt(r.avg_processed_tpa)} TPA</td></tr>
    <tr><th>Modelled recovery-gap context</th><td>${pct(r.recovery_gap_fraction*100)}</td></tr>
    <tr><th>Approx. recovered share context</th><td>${pct((1-r.recovery_gap_fraction)*100)}</td></tr>
    <tr><th>Active management pathways</th><td>${Number(r.active_pathways).toFixed(1)}</td></tr>`;
  }
  box.innerHTML=`<div class="region-analysis-head"><div><span class="topic-tag">${sec==='agriculture'?'AGRICULTURAL BIOMASS':'PLASTIC WASTE'}</span><h3>${escapeHtml(region)} — Regional Analysis</h3><p>Analytical details from the final model dataset.</p></div><span class="badge ${r.opportunity.toLowerCase()}">${r.opportunity} Opportunity</span></div>
  <div class="table-wrap"><table class="region-detail-table"><tbody>${metrics}<tr><th>Recovery Opportunity Index (CRROM)</th><td><b>${r.opportunity_index.toFixed(2)} / 100</b></td></tr><tr><th>Opportunity category</th><td>${r.opportunity}</td></tr><tr><th>K-Means regional profile</th><td>Cluster ${r.cluster}</td></tr></tbody></table></div>
  <p class="map-status">CRROM is a prioritization index, not a recovery percentage. The K-Means cluster is a regional analytical profile, not a performance rank.</p>`;
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
}

/* ===== MENTOR VERIFIED FINAL CORRECTIONS =====
   1) English-only presentation build.
   2) Action Center exists only for Farmer and Industry roles.
   3) Knowledge Hub future-scope/prototype panel removed in HTML.
   4) Account status removed from Action Center UI/results.
   5) Download helpers made browser-safe with no PDF CDN dependency.
*/
(function mentorFinalCorrections(){
  // English only. Keep legacy translation code dormant so no mixed-language state can persist.
  try { localStorage.setItem('cri_language','en'); } catch(e) {}

  const actionAllowed = role => role === 'Farmer' || role === 'Industry';

  window.updateRoleVisibility = function(){
    const u = getUser();
    const role = u && u.role ? u.role : null;
    const allowed = !role || actionAllowed(role); // before role selection, keep general platform visible
    const selectors = [
      '.navlinks button[data-page="action"]',
      '#landing .card.highlight',
      '#landing button[onclick*="action"]',
      '#home button[onclick*="action"]',
      '.quick-grid button[onclick*="action"]'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(el=>el.style.display = allowed ? '' : 'none');
    if(!allowed && document.querySelector('#action.page.active')) _criBaseShowPage('home');
  };

  // Direct access is also blocked for Government/Researcher, not merely hidden in navigation.
  const previousOpenProtectedPage = window.openProtectedPage;
  window.openProtectedPage = function(id,preselect=null){
    if(id === 'action'){
      const u = getUser();
      if(u && u.role && !actionAllowed(u.role)){
        _criBaseShowPage('home');
        updateRoleVisibility();
        return;
      }
    }
    return previousOpenProtectedPage(id,preselect);
  };

  const previousShowPage = window.showPage;
  window.showPage = function(id){
    if(id === 'action'){
      const u = getUser();
      if(u && u.role && !actionAllowed(u.role)){
        _criBaseShowPage('home');
        updateRoleVisibility();
        return;
      }
    }
    previousShowPage(id);
    updateRoleVisibility();
  };

  const previousSelectRole = window.selectRole;
  window.selectRole = function(role){
    previousSelectRole(role);
    // Keep the signed-in prototype session in sync when the user changes role/name.
    // This ensures Action Center is visible for Farmer/Industry and hidden only for Government/Researcher.
    try {
      const session = getAuthSession();
      if(session){
        session.role = role;
        const current = getUser();
        if(current && current.name) session.name = current.name;
        localStorage.setItem(CRI_AUTH_SESSION, JSON.stringify(session));
      }
    } catch(e) {}
    setTimeout(updateRoleVisibility,0);
  };

  // If a Government/Researcher account logs in, never route it to Action Center.
  const previousSubmitAuth = window.submitAuth;
  window.submitAuth = async function(){
    await previousSubmitAuth();
    const u = getAuthSession();
    if(u && !actionAllowed(u.role)){
      criPendingPage = null; criPendingAction = null;
      _criBaseShowPage('home');
    }
    updateRoleVisibility();
  };

  // Ensure the Action Center itself only offers its intended two user groups.
  const roleSelect = document.getElementById('actionRole');
  if(roleSelect){
    [...roleSelect.options].forEach(o=>{ if(!actionAllowed(o.value)) o.remove(); });
  }

  // Remove any legacy account/prototype status content from the Action Center result.
  const previousRenderActionResult = window.renderActionResult;
  window.renderActionResult = function(r){
    previousRenderActionResult(r);
    const result = document.getElementById('actionResult');
    if(result){
      result.querySelectorAll('.action-metrics > div').forEach(div=>{
        const t=(div.textContent||'').toLowerCase();
        if(t.includes('account status') || t.includes('prototype')) div.remove();
      });
    }
  };

  // Reliable browser download helper: attach link to DOM, click, then clean up.
  window.downloadBlob = function(content,name,type){
    const blob = content instanceof Blob ? content : new Blob([content],{type:type||'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=name; a.style.display='none';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },1500);
  };

  // CSV: UTF-8 BOM improves direct Excel opening and guarantees a real downloadable file.
  window.exportIntelligenceCSV = function(){
    const sec=$('intelSector').value;
    const rows=sec==='agriculture'?D.agriculture:sec==='plastic'?D.plastic:D.ewaste;
    if(!rows || !rows.length) return;
    const keys=Object.keys(rows[0]);
    const csv='\uFEFF'+[keys.join(','),...rows.map(r=>keys.map(k=>`"${String(r[k]??'').replaceAll('"','""')}"`).join(','))].join('\r\n');
    downloadBlob(csv,`${sec}_waste_intelligence.csv`,'text/csv;charset=utf-8');
  };

  // Self-contained Action Report download. No external PDF library is required.
  // The report is a standalone HTML document that downloads and opens/prints cleanly in every browser.
  window.downloadActionPDF = function(){
    const r=JSON.parse(sessionStorage.getItem('cri_last_action')||'null');
    if(!r) return;
    const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const contacts=(r.contacts||[]).map(c=>`<tr><td>${esc(c.company)}</td><td>${esc([c.city,c.state].filter(Boolean).join(', '))}</td><td>${esc(c.phone||'')}</td><td>${esc(c.email_or_contact||c.contact_url||'')}</td></tr>`).join('');
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>CRI Action Report</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;color:#17231d;line-height:1.5}h1{font-size:24px}h2{font-size:17px;margin-top:26px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #bbb;padding:8px;text-align:left}.meta{background:#f3f6f4;padding:16px;border-radius:8px}.note{font-size:12px;color:#555}@media print{body{margin:18mm}.no-print{display:none}}</style></head><body><h1>Circular Resource Intelligence – Action Report</h1><div class="meta"><b>Generated:</b> ${esc(r.timestamp)}<br><b>Role:</b> ${esc(r.role)}<br><b>Waste:</b> ${esc(r.sector)} – ${esc(r.subtype)}<br><b>Region:</b> ${esc(r.region)}<br><b>Input quantity:</b> ${Number(r.quantity||0).toFixed(2)} tonnes<br><b>${esc(r.recoveryLabel)}:</b> ${Number(r.recoveryQuantity||0).toFixed(2)} tonnes<br><b>Recovery Opportunity Index:</b> ${Number(r.index||0).toFixed(2)} (${esc(r.opportunity)})</div><h2>Recovery context</h2><p>${esc(r.basis)}</p><h2>Recommended utilization pathways</h2><ul>${(r.pathways||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h2>Potential contacts</h2>${contacts?`<table><thead><tr><th>Organization</th><th>Location</th><th>Phone</th><th>Contact</th></tr></thead><tbody>${contacts}</tbody></table>`:'<p>No matching contact stored for this selection.</p>'}<h2>Recommended next action</h2><p>${esc(r.roleAdvice||'Confirm material specifications, current acceptance, commercial terms and logistics directly before dispatch.')}</p><p class="note">CRROM is a supporting prioritization index, not a recovery percentage. Contact listings do not guarantee purchase, price or acceptance.</p><p class="no-print"><b>Tip:</b> Open this downloaded report and use Print → Save as PDF if a PDF copy is required.</p></body></html>`;
    downloadBlob(html,'CRI_Action_Report.html','text/html;charset=utf-8');
  };

  updateRoleVisibility();
})();

/* ===== ACTION PLAN GENERATION FIX ONLY ===== */
(function actionPlanGenerationFix(){
  const allowedActionRole = role => role === 'Farmer' || role === 'Industry';
  function activeActionRole(){
    const selected = $('actionRole') && $('actionRole').value;
    if(allowedActionRole(selected)) return selected;
    const session = (typeof getAuthSession === 'function') ? getAuthSession() : null;
    if(session && allowedActionRole(session.role)) return session.role;
    const profile = (typeof getUser === 'function') ? getUser() : null;
    return (profile && allowedActionRole(profile.role)) ? profile.role : null;
  }

  const oldSetupAction = window.setupAction;
  window.setupAction = function(preselect){
    oldSetupAction(preselect);
    const role = activeActionRole();
    if(role && $('actionRole')){
      $('actionRole').value = role;
      $('actionRole').disabled = true;
    }
    if(typeof setActionRoleUI === 'function') setActionRoleUI();
  };

  window.runActionAnalysis = function(){
    try{
      if(!isAuthenticated()){ openAuthModal('action'); return; }
      const role = activeActionRole();
      if(!role){
        _criBaseShowPage('home');
        if(typeof updateRoleVisibility === 'function') updateRoleVisibility();
        return;
      }
      const sec=$('actionSector').value, sub=$('actionSubtype').value, region=$('actionRegion').value;
      const qty=parseFloat($('actionQty').value);
      const price=role==='Farmer'?parseFloat($('actionPrice').value):NaN;
      if(!Number.isFinite(qty)||qty<=0){ alert('Enter a valid waste quantity.'); return; }
      const rc=recoveryContext(sec,region,qty);
      if(!rc||!Number.isFinite(Number(rc.value))) throw new Error('Recovery context unavailable');
      const contacts=contactMatches(sec,sub,region)||[];
      const routeList=(typeof pathwayDetail==='function')?pathwayDetail(sec,sub):pathways(sec,sub);
      const result={timestamp:new Date().toLocaleString(),role,sector:sectorLabel[sec],sectorKey:sec,subtype:sub,region,quantity:qty,recoveryQuantity:Number(rc.value),recoveryLabel:rc.label,basis:rc.basis,index:Number(rc.index),opportunity:rc.opp,value:Number.isFinite(price)?Number(rc.value)*price:null,contacts,pathways:routeList};
      sessionStorage.setItem('cri_last_action',JSON.stringify(result));
      saveHistory(result);
      renderActionResult(result);
      const resultEl=$('actionResult');
      if(resultEl) resultEl.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){
      console.error('CRI Action Plan generation error:',err);
      const resultEl=$('actionResult');
      if(resultEl){resultEl.className='result-card';resultEl.innerHTML='<div class="action-section"><h4>Action Plan could not be generated</h4><p>Please confirm the waste type, subtype, region and quantity, then try again.</p></div>';}
    }
  };

  const generateBtn=document.querySelector('#action button[onclick*="runActionAnalysis"]');
  if(generateBtn) generateBtn.onclick=window.runActionAnalysis;
  const role=activeActionRole();
  if(role&&$('actionRole')){$('actionRole').value=role;$('actionRole').disabled=true;}
})();
