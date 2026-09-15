const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..'), context = vm.createContext({ window: {} });
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const contentFiles = [...html.matchAll(/<script src="(content\/[a-z0-9-]+\.js)"><\/script>/g)].map(match => match[1]);
for (const file of ['cr_app_data.js', 'js/explanation-library.js', ...contentFiles]) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
const { CR_DATA: data, CRExplanationLibrary: api, CR_AUTHORED_EXPLANATIONS: records } = context.window;
if (process.argv[2] === '--fingerprint') {
  const question = data.questions.find(q => q.id === process.argv[3]);
  if (!question) throw new Error('Pass a valid question ID');
  console.log(api.fingerprint(question));
} else {
  const library = api.create(data.questions, records);
  console.log(JSON.stringify({ ...library.stats(), rejectedRecords: library.issues, sourceIssues: library.records().filter(r => r.issue).map(r => ({ qid: r.qid, issue: r.issue })) }, null, 2));
  if (library.issues.length) process.exitCode = 1;
}
