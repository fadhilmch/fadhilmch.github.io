/* SL Journey Planner v2. Keep unknown transit modes out, even if the API ignores filters. */
(function (root) {
  const API = 'https://journeyplanner.integration.sl.se/v2/';
  const excluded = /^[1-6]$/;
  function line(leg) {
    const t = leg.transportation || {};
    const raw = t.disassembledName || t.number || '';
    return String(raw).trim().replace(/^Bus\s+/i, '').replace(/^0+(?=\d)/, '');
  }
  function kind(leg) {
    const c = Number(leg.transportation?.product?.class);
    if (c === 5) return 'bus';
    if (c === 99) return 'walk';
    return 'other';
  }
  function eligible(journey) {
    if (!Array.isArray(journey?.legs) || !journey.legs.length) return false;
    let bus = false;
    for (const l of journey.legs) {
      if (kind(l) === 'walk') continue;
      if (kind(l) !== 'bus' || !line(l) || excluded.test(line(l))) return false;
      bus = true;
    }
    return bus;
  }
  function tripURL(from, to, preference = 'leasttime', departure) {
    const u = new URL('trips', API);
    Object.entries({type_origin:'any', name_origin:from, type_destination:'any', name_destination:to,
      calc_number_of_trips:3, calc_one_direction:true, language:'en', route_type:preference,
      incl_mot_0:false, incl_mot_2:false, incl_mot_4:false, incl_mot_5:true,
      incl_mot_9:false, incl_mot_10:false, incl_mot_14:false, incl_mot_19:false,
      compute_monomodal_trip_bicycle:false, compute_monomodal_trip_pedestrian:false,
      use_prox_foot_search:true}).forEach(([k,v]) => u.searchParams.set(k,v));
    if (departure) {
      const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(departure);
      const val = key => parts.find(p=>p.type===key).value;
      u.searchParams.set('itd_date',val('year')+val('month')+val('day'));
      u.searchParams.set('itd_time',val('hour')+val('minute'));
    }
    return u.href;
  }
  async function search(from,to,preference,get,onProgress=()=>{}) {
    const preferences=[preference,...['leasttime','leastinterchange','leastwalking'].filter(p=>p!==preference)];
    for (let i=0;i<4;i++) {
      onProgress(i);
      const later=i===3?new Date(Date.now()+30*60000):undefined;
      const data=await get(tripURL(from,to,preferences[i]||preference,later));
      const journeys=(data.journeys||[]).filter(eligible);
      if(journeys.length)return {journeys,attempts:i+1,later:!!later,preference:preferences[i]||preference};
    }
    return {journeys:[],attempts:4,later:true,preference};
  }
  function lookupURL(text) {
    const u = new URL('stop-finder', API);
    u.search = new URLSearchParams({name_sf:text,type_sf:'any',any_obj_filter_sf:'46'});
    return u.href;
  }
  const api = {line,kind,eligible,tripURL,lookupURL,search};
  if (typeof module !== 'undefined') module.exports = api;
  else root.StrollerRoutes = api;
})(globalThis);
