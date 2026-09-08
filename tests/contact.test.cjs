const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync('contact.js', 'utf8');
function setup({saved, search = '', blocked = false, valid = true} = {}) {
  const fields = Object.fromEntries(['fullName','email','company','message','inquiryType'].map(k => [k, {value: k === 'inquiryType' ? 'Request a quote' : ''}]));
  const nodes = {};
  const events = {};
  const form = {
    elements: {namedItem: name => fields[name]},
    querySelector: selector => nodes[selector] ||= {},
    addEventListener: (name, callback) => events[name] = callback,
    checkValidity: () => valid,
    reportValidity: () => {}
  };
  const location = {search, href: ''};
  const storage = {
    getItem() {if (blocked) throw Error('Unavailable'); return JSON.stringify(saved || null);},
    setItem() {if (blocked) throw Error('Unavailable');}
  };
  vm.runInNewContext(source, {
    document: {querySelector: () => form}, window: {location}, localStorage: storage,
    URLSearchParams, FormData: class {entries() {return Object.entries(fields).map(([name, field]) => [name, field.value]);}}
  });
  return {fields, nodes, events, location};
}
let state = setup({saved: {firstName:'Jane', lastName:'Doe', inquiryType:'Careers', message:'Existing draft'}, search:'?inquiry=quote'});
assert.equal(state.fields.fullName.value, 'Jane Doe');
assert.equal(state.fields.inquiryType.value, 'Request a quote');
assert.equal(state.fields.message.value, 'Existing draft');
state.fields.email.value = 'jane@example.com';
state.fields.message.value = 'Model costs & benefits\nTimeline: October';
state.events.submit({preventDefault(){}});
let url = new URL(state.location.href);
assert.equal(url.pathname, 'contact@skartech.com');
assert.match(url.searchParams.get('subject'), /^Request a quote/);
assert.match(url.searchParams.get('body'), /Model costs & benefits\nTimeline: October/);
assert.match(state.nodes['.form-status'].textContent, /has not been sent/);
state = setup({blocked:true});
state.events.input();
state.events.submit({preventDefault(){}});
assert.match(state.location.href, /^mailto:/);
state = setup({valid:false});
state.events.submit({preventDefault(){}});
assert.equal(state.location.href, '');
state = setup({saved:{inquiryType:'Research and collaboration'}});
assert.equal(state.fields.inquiryType.value, 'General inquiry');
assert.equal(state.nodes['.message-label'].textContent, 'Your message *');
console.log('Passed: quote deep link, draft migration, email encoding, unavailable storage, validation, other inquiry.');
