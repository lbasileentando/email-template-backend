// server.js
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

let templates = [];

app.post('/api/templates', (req, res) => {
  const { author, content, version } = req.body;
  const newTemplate = { 
    id: Date.now().toString(), 
    author, 
    content, 
    version: version || 1, 
    state: 'staged' 
  };
  templates.push(newTemplate);
  res.status(201).json(newTemplate);
});

/*app.get('/api/templates', (req, res) => {
  res.json({templates:templates});
});*/

app.get('/api/templates', (req, res) => {
  const { search = req.query.search, sortKey = req.query.author, sortDirection = req.query.sortDirection, page = req.query.page, pageSize = req.query.pageSize } = req.query;
  
  // Filter templates based on search query
  let filteredTemplates = templates.filter(template =>{
    return template.author.toLowerCase().includes(search.toLowerCase()) ||
    template.state.toLowerCase().includes(search.toLowerCase()) ||
    template.content.toLowerCase().includes(search.toLowerCase());}
  );


  // Sort templates based on sortKey and sortDirection
  filteredTemplates.sort((a, b) => {
    if (a[sortKey] < b[sortKey]) return sortDirection === 'ascending' ? -1 : 1;
    if (a[sortKey] > b[sortKey]) return sortDirection === 'ascending' ? 1 : -1;
    return 0;
  });

  // Paginate templates
  const totalTemplates = filteredTemplates.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

  res.json({ templates: paginatedTemplates,totalTemplates:totalTemplates});
});

app.post('/api/templates/:id/approve', (req, res) => {
  const { id } = req.params;
  const template = templates.find(t => t.id === id);
  if (template) {
    template.state = 'approved';
    res.json(template);
  } else {
    res.status(404).send('Template not found');
  }
});

app.post('/api/templates/:id/reject', (req, res) => {
  const { id } = req.params;
  const template = templates.find(t => t.id === id);
  if (template) {
    template.state = 'rejected';
    res.json(template);
  } else {
    res.status(404).send('Template not found');
  }
});

app.delete('/api/templates/:id', (req, res) => {
  const { id } = req.params;
  const index = templates.findIndex(t => t.id === id);
  if (index !== -1) {
    templates.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).send('Template not found');
  }
});

app.post('/api/send-email', (req, res) => {
  const { templateId, users } = req.body;
  const template = templates.find(t => t.id === templateId);
  if (!template) {
    return res.status(404).send('Template not found');
  }

  const transporter = nodemailer.createTransport({
    //TODO: replace with proper setitngs
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password'
    }
  });

  users.forEach(user => {
    //TODO: replace with proper setitngs
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: user.email,
      subject: 'Dynamic Email',
      html: template.content.replace(/\{\{(\w+)\}\}/g, (_, key) => user[key] || '')
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  });

  res.send('Emails sent');
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
