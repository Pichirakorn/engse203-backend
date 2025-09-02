const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// ------------------ Middleware ------------------
app.use(express.json()); // parse JSON body
app.use(cors()); // allow cross-origin requests

// ------------------ Agent Data ------------------
let agents = [
   {
      code: "A001",
      name: "Thanit",
      status: "Available",
      loginTime: new Date()
   },
   {
      code: "A002",
      name: "Alex",
      status: "Wrap Up",
      loginTime: new Date()
   },
   {
      code: "A003",
      name: "Jeny",
      status: "Active",
      loginTime: new Date()
   },
];

// ------------------ Routes ------------------

// GET all agents
app.get('/api/agents', (req, res) => {
    res.json({
        success: true,
        data: agents,
        count: agents.length,
        timestamp: new Date().toISOString()
    });
});

// GET agent count
app.get('/api/agents/count', (req, res) => {
    res.json({
        success: true,
        count: agents.length,
        timestamp: new Date().toISOString()
    });
});

// PATCH update agent status
app.patch('/api/agents/:code/status', (req, res) => {
    const agentCode = req.params.code;
    const newStatus = req.body.status;

    const agent = agents.find(a => a.code === agentCode);
    if (!agent) {
        return res.status(404).json({ success: false, error: "Agent not found" });
    }

    const validStatuses = ["Available", "Active", "Wrap Up", "Not Ready", "Offline"];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ success: false, error: "Invalid status", validStatuses });
    }

    const oldStatus = agent.status;
    agent.status = newStatus;
    agent.lastStatusChange = new Date();

    console.log(`[${new Date().toISOString()}] Agent ${agentCode}: ${oldStatus} → ${newStatus}`);

    res.json({
        success: true,
        message: `Agent ${agentCode} status changed from ${oldStatus} to ${newStatus}`,
        data: agent
    });
});

// Dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
    const totalAgents = agents.length;

    const available = agents.filter(a => a.status === "Available").length;
    const active = agents.filter(a => a.status === "Active").length;
    const wrapUp = agents.filter(a => a.status === "Wrap Up").length;
    const notReady = agents.filter(a => a.status === "Not Ready").length;
    const offline = agents.filter(a => a.status === "Offline").length;

    const percent = count => totalAgents > 0 ? Math.round((count / totalAgents) * 100) : 0;

    res.json({
        success: true,
        data: {
            total: totalAgents,
            statusBreakdown: {
                available: { count: available, percent: percent(available) },
                active: { count: active, percent: percent(active) },
                wrapUp: { count: wrapUp, percent: percent(wrapUp) },
                notReady: { count: notReady, percent: percent(notReady) },
                offline: { count: offline, percent: percent(offline) },
            },
            timestamp: new Date().toISOString()
        }
    });
});

// Agent Login
app.post('/api/agents/:code/login', (req, res) => {
    const agentCode = req.params.code;
    const { name } = req.body;

    let agent = agents.find(a => a.code === agentCode);
    if (!agent) {
        agent = { code: agentCode, name, status: "Available", loginTime: new Date() };
        agents.push(agent);
    } else {
        agent.name = name;
        agent.status = "Available";
        agent.loginTime = new Date();
    }

    res.json({ success: true, message: `Agent ${agentCode} logged in`, data: agent });
});

// Agent Logout
app.post('/api/agents/:code/logout', (req, res) => {
    const agentCode = req.params.code;
    const agent = agents.find(a => a.code === agentCode);

    if (!agent) return res.status(404).json({ success: false, error: "Agent not found" });

    agent.status = "Offline";
    delete agent.loginTime;

    res.json({ success: true, message: `Agent ${agentCode} logged out`, data: agent });
});

// Basic routes
app.get('/', (req, res) => res.send(`Hello Agent Wallboard!`));
app.get('/hello', (req, res) => res.send(`Hello สวัสดี!`));
app.get('/health', (req, res) => res.send({ status: 'OK', timestamp: new Date().toISOString() }));

// ------------------ Start Server ------------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
