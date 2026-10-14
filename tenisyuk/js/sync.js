// Versioned save boundary. Unknown outcomes never become automatic retries.
(function(root){
  const version = v => typeof v === 'string' && /^(0|[1-9][0-9]*)$/.test(v);
  const messages = {
    conflict:'Not saved: someone changed the data. Latest data loaded. Review your change and try again.',
    upgrade_required:'Not saved: the database needs the versioned-save update. Refresh after it is applied.',
    too_many_removals:'Not saved: only one removal per save.',
  };
  async function save(state,rpc,load){
    if(!version(state.version)){state.err=messages.upgrade_required;return 'offline'}
    const requestDoc=state.doc, expected=state.version;
    try{
      const r=await rpc('admin_save_v2',{p_code:state.admin,p_doc:requestDoc,p_expected_version:expected});
      if(r.ok && version(r.version)){state.version=r.version;state.err='';return 'ok'}
      state.err=messages[r.error]||'Not saved: '+(r.error||'invalid server response');
    }catch(e){state.err='Save outcome unknown. Latest data loaded if available. Review before trying again.'}
    try{
      const fresh=await load(state.code);
      if(fresh.error || !version(fresh.version))throw new Error('invalid reload');
      state.doc=fresh;state.cfg=fresh.cfg;state.version=fresh.version;
    }catch(e){state.version=null;state.err+=' Reload failed. Refresh before editing.'}
    return 'server';
  }
  const api={save,version,messages};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TYSync=api;
})(typeof window!=='undefined'?window:globalThis);
