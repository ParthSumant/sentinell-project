const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8000;
const DB_FILE = path.join(__dirname, 'database.json');

// Default initial state
const defaultDb = {
  settings: {
    tariffKwh: 8.50,
    carbonKwh: 0.82,
    waterLitre: 0.05
  },
  reports: [
    {
      id: 'REP-7021',
      author: 'Rohit Verma',
      userRole: 'student',
      zone: 'CS Computer Lab 2',
      resource: 'Electricity',
      severity: 'CRITICAL',
      notes: 'High-spec desktop workstations and AC units running idle at 2:00 AM.',
      status: 'SOLVED',
      timestamp: '2026-10-12 02:15:00',
      solvedAt: '2026-10-12 02:42:00',
      resolvedBy: 'admin',
      resolutionNotes: 'Virtual relay cutoff engaged. Power draw dropped from 14.8 kW to 2.1 kW.',
      estimatedLossPerHour: 108.0, // (14.8 - 2.1) * 8.5
      lossAvertedTotal: 540.0
    },
    {
      id: 'REP-7022',
      author: 'Priya Sharma',
      userRole: 'student',
      zone: 'Hostel Block B',
      resource: 'Water',
      severity: 'WARNING',
      notes: 'Continuous flow sound in 2nd floor bathroom riser pipeline.',
      status: 'SOLVED',
      timestamp: '2026-10-12 04:30:00',
      solvedAt: '2026-10-12 05:10:00',
      resolvedBy: 'admin',
      resolutionNotes: 'Solenoid pressure valve throttled and maintenance dispatched.',
      estimatedLossPerHour: 75.9,
      lossAvertedTotal: 380.0
    },
    {
      id: 'REP-7023',
      author: 'Aarav Patel',
      userRole: 'student',
      zone: 'Main Academic Wing',
      resource: 'Electricity',
      severity: 'INFO',
      notes: 'Corridor lights on 3rd floor remained active after classes ended at 6 PM.',
      status: 'PENDING',
      timestamp: '2026-10-12 09:15:00',
      solvedAt: null,
      resolvedBy: null,
      resolutionNotes: null,
      estimatedLossPerHour: 34.0,
      lossAvertedTotal: 0
    }
  ],
  telemetryZones: [
    { id: 'cs-lab', name: 'CS Computer Lab 2', baselineKw: 2.1, currentKw: 2.1, status: 'optimal' },
    { id: 'hostel', name: 'Hostel Block B', baselineFlow: 3.2, currentFlow: 3.2, status: 'optimal' },
    { id: 'academic', name: 'Main Academic Wing', baselineKw: 5.4, currentKw: 5.4, status: 'optimal' },
    { id: 'library', name: 'Central Library', baselineKw: 3.5, currentKw: 3.5, status: 'optimal' }
  ]
};

// Initialize or read Database
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB, using default:', err);
  }
  saveDb(defaultDb);
  return defaultDb;
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Request Body Parser Helper
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // -------------------------------------------------------------
  // API Endpoints
  // -------------------------------------------------------------
  
  // 1. Auth: Admin verification
  if (pathname === '/api/auth/admin-login' && method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { username, password } = body;
      
      if (username === 'admin' && password === 'pass111') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          role: 'admin', 
          name: 'Administrator', 
          token: 'adm_session_' + Date.now() 
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: 'Invalid credentials. Username must be "admin" and password "pass111".' 
        }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid payload' }));
    }
    return;
  }

  // 2. GET /api/reports: Fetch all reports or filtered by author
  if (pathname === '/api/reports' && method === 'GET') {
    const db = loadDb();
    const author = parsedUrl.query.author;
    let list = db.reports;
    
    if (author && author.toLowerCase() !== 'admin') {
      list = db.reports.filter(r => r.author.toLowerCase() === author.toLowerCase());
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, reports: list }));
    return;
  }

  // 3. POST /api/reports: Submit new report (by user or admin)
  if (pathname === '/api/reports' && method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const db = loadDb();
      
      const newReport = {
        id: 'REP-' + Math.floor(1000 + Math.random() * 9000),
        author: body.author || 'Anonymous Student',
        userRole: body.userRole || 'student',
        zone: body.zone || 'General Campus',
        resource: body.resource || 'Electricity',
        severity: body.severity || 'WARNING',
        notes: body.notes || 'No description provided.',
        status: 'PENDING',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        solvedAt: null,
        resolvedBy: null,
        resolutionNotes: null,
        estimatedLossPerHour: body.resource === 'Water' ? 55.0 : (body.severity === 'CRITICAL' ? 108.0 : 34.0),
        lossAvertedTotal: 0
      };

      db.reports.unshift(newReport);
      saveDb(db);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, report: newReport }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Failed to create report' }));
    }
    return;
  }

  // 4. PATCH /api/reports/:id/status: Admin mark as solved or reopen
  if (pathname.startsWith('/api/reports/') && pathname.endsWith('/status') && method === 'PATCH') {
    try {
      const parts = pathname.split('/');
      const reportId = parts[3];
      const body = await parseJsonBody(req);
      const db = loadDb();

      const report = db.reports.find(r => r.id === reportId);
      if (!report) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Report not found' }));
        return;
      }

      report.status = body.status || 'SOLVED';
      if (report.status === 'SOLVED') {
        report.solvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
        report.resolvedBy = body.resolvedBy || 'admin';
        report.resolutionNotes = body.resolutionNotes || 'Verified and marked solved by Facilities Admin.';
        // Calculate loss averted
        report.lossAvertedTotal = Math.round((report.estimatedLossPerHour || 50) * 4.5);
      } else {
        report.solvedAt = null;
        report.resolvedBy = null;
        report.lossAvertedTotal = 0;
      }

      saveDb(db);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, report }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Failed to update report' }));
    }
    return;
  }

  // 5. GET /api/admin/loss-analytics: Financial and Resource loss metrics
  if (pathname === '/api/admin/loss-analytics' && method === 'GET') {
    const db = loadDb();
    
    // Calculate pending sustained loss
    const pendingReports = db.reports.filter(r => r.status === 'PENDING');
    const solvedReports = db.reports.filter(r => r.status === 'SOLVED');

    const sustainedLossPerHour = pendingReports.reduce((sum, r) => sum + (r.estimatedLossPerHour || 0), 0);
    const totalLossAverted = solvedReports.reduce((sum, r) => sum + (r.lossAvertedTotal || 0), 0);

    const electricityPending = pendingReports.filter(r => r.resource === 'Electricity').length;
    const waterPending = pendingReports.filter(r => r.resource === 'Water').length;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      metrics: {
        totalReports: db.reports.length,
        pendingCount: pendingReports.length,
        solvedCount: solvedReports.length,
        sustainedLossPerHour: +(sustainedLossPerHour).toFixed(2),
        estimatedDailySustainedLoss: +(sustainedLossPerHour * 24).toFixed(2),
        totalLossAverted: +(totalLossAverted).toFixed(2),
        electricityPending,
        waterPending,
        activeTariff: db.settings.tariffKwh
      }
    }));
    return;
  }

  // -------------------------------------------------------------
  // Static File Serving (index.html, assets)
  // -------------------------------------------------------------
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'index.html');
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading application file.');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'text/html';
      if (ext === '.css') contentType = 'text/css';
      if (ext === '.js') contentType = 'application/javascript';
      if (ext === '.json') contentType = 'application/json';
      if (ext === '.png') contentType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      if (ext === '.svg') contentType = 'image/svg+xml';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`EcoPulse Server with Auth & Analytics is live!`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Database: ${DB_FILE}`);
  console.log(`====================================================`);
});
