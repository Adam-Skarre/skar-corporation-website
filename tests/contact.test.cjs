const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync('contact.js', 'utf8');
function setup({saved, search = '', blocked = false, valid = true, response = {ok:true}, fail = false, pending} = {}) {
  const fields = Object.fromEntries(['fullName','email','company','message','industry','inquiryType'].map(k => [k, {value: k === 'inquiryType' ? 'Request a quote' : '', disabled:false}]));
  const nodes = {}, events = {}, requests = [];
  let cleared = false;
  const form = {
    action:'https://formspree.io/f/xvkovvnv',
    elements:{namedItem:name => fields[name]},
    querySelector:selector => nodes[selector] ||= {},
    querySelectorAll:() => [...Object.values(fields), nodes['.contact-submit']],
    addEventListener:(name, callback) => events[name] = callback,
    checkValidity:() => valid, reportValidity() {}, setAttribute() {}, removeAttribute() {},
    reset() {Object.entries(fields).forEach(([k,f]) => {f.value = k === 'inquiryType' ? 'Request a quote' : '';});}
  };
  vm.runInNewContext(source, {
    document:{querySelector:() => form}, window:{location:{search}}, URLSearchParams,
    localStorage:{
      getItem() {if(blocked) throw Error(); return JSON.stringify(saved || null);},
      setItem() {if(blocked) throw Error();},
      removeItem() {if(blocked) throw Error(); cleared = true;}
    },
    FormData:class extends Map {constructor(){super(Object.entries(fields).map(([k,f]) => [k,f.value]));}},
    fetch:async (url, options) => {requests.push({url,options}); if(fail) throw Error(); return pending ? await pending : response;}
  });
  return {fields,nodes,events,requests,cleared:() => cleared};
}
(async () => {
  let s = setup({saved:{firstName:'Jane',lastName:'Doe',inquiryType:'Careers'},search:'?inquiry=quote'});
  assert.equal(s.fields.fullName.value,'Jane Doe');
  assert.equal(s.fields.inquiryType.value,'Request a quote');
  s.fields.email.value = 'jane@example.com';
  s.fields.industry.value = 'Energy & Infrastructure';
  s.fields.message.value = 'Model costs & benefits';
  await s.events.submit({preventDefault(){}});
  assert.equal(s.requests[0].url,'https://formspree.io/f/xvkovvnv');
  assert.equal(s.requests[0].options.body.get('industry'),'Energy & Infrastructure');
  assert.equal(s.requests[0].options.body.get('email'),'jane@example.com');
  assert.match(s.requests[0].options.body.get('subject'),/^Request a quote/);
  assert.match(s.nodes['.form-status'].textContent,/has been received/);
  assert.equal(s.fields.message.value,''); assert(s.cleared());
  for(const options of [{response:{ok:false,status:422}},{response:{ok:false,status:429}},{fail:true}]) {
    s = setup(options); s.fields.message.value = 'Retain this';
    await s.events.submit({preventDefault(){}});
    assert.equal(s.fields.message.value,'Retain this'); assert(!s.cleared());
    assert.match(s.nodes['.form-status'].textContent,/retained/);
    assert(!s.nodes['.contact-submit'].disabled);
  }
  s = setup({valid:false}); await s.events.submit({preventDefault(){}}); assert.equal(s.requests.length,0);
  s = setup({blocked:true}); await s.events.submit({preventDefault(){}}); assert.equal(s.requests.length,1);
  s = setup({saved:{inquiryType:'Careers'}}); assert.equal(s.fields.inquiryType.value,'Careers');
  await s.events.submit({preventDefault(){}}); assert.match(s.requests[0].options.body.get('subject'),/^Careers/);
  let resolve; const pending = new Promise(r => resolve = r);
  s = setup({pending}); const first = s.events.submit({preventDefault(){}});
  assert(s.nodes['.contact-submit'].disabled);
  await s.events.submit({preventDefault(){}}); assert.equal(s.requests.length,1);
  resolve({ok:true}); await first; assert(!s.nodes['.contact-submit'].disabled);
  console.log('Passed: Formspree payload, quote links, draft restoration, success/reset, HTTP and network errors, validation, blocked storage, careers, duplicate prevention.');
})().catch(error => {console.error(error); process.exitCode = 1;});
