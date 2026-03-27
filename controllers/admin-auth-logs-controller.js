const AuditLog = require('../models/audit_log_model');
const database = require('../models/database');

const admin_auth_logs_controller = {
    get_admin_auth_logs: function(req, res) {
        res.render('admin-auth-logs');
    },

    get_auth_logs: async function(req, res) {
        const selectedDate = req.query.s_date;
        const selectedAction = req.query.action;

        const query = {};

        if (selectedDate) {
            const startOfDay = new Date(`${selectedDate}T00:00:00`);
            const endOfDay = new Date(startOfDay);
            endOfDay.setDate(endOfDay.getDate() + 1);
            query.Logged_At = { $gte: startOfDay, $lt: endOfDay };
        }

        if (selectedAction && selectedAction !== 'ALL') {
            query.Action = selectedAction;
        }

        try {
            const logs = await database.findMany(AuditLog, query);
            logs.sort((a, b) => new Date(b.Logged_At) - new Date(a.Logged_At));

            res.render('admin-auth-logs', {
                logs,
                selectedDate,
                selectedAction: selectedAction || 'ALL'
            });
        } catch (error) {
            console.error('Error processing audit logs:', error);
            res.status(500).send('Internal Server Error!');
        }
    }
};

module.exports = admin_auth_logs_controller;
