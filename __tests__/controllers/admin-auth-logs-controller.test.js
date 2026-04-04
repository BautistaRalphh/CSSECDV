const admin_auth_logs_controller = require('../../controllers/admin-auth-logs-controller');
const auditLog = require('../../models/audit_log_model');
const database = require('../../models/database');

jest.mock('../../models/database');

describe('admin_auth_logs_controller', () => {
    let req, res;

    beforeEach(() => {
        req = { query: {} };
        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });

    it('should render the admin-auth-logs view', () => {
        admin_auth_logs_controller.get_admin_auth_logs(req, res);

        expect(res.render).toHaveBeenCalledWith('admin-auth-logs');
    });

    it('should render filtered audit logs sorted from newest to oldest', async () => {
        req.query.s_date = '2026-03-27';
        req.query.action = 'LOGIN';

        const logs = [
            { Email: 'b@example.com', Employee_Type: 'Admin', Action: 'LOGIN', Logged_At: new Date('2026-03-27T08:00:00') },
            { Email: 'a@example.com', Employee_Type: 'Admin', Action: 'LOGIN', Logged_At: new Date('2026-03-27T09:00:00') }
        ];
        database.findMany.mockResolvedValue(logs);

        await admin_auth_logs_controller.get_auth_logs(req, res);

        expect(database.findMany).toHaveBeenCalledWith(auditLog, {
            Logged_At: {
                $gte: new Date('2026-03-27T00:00:00'),
                $lt: new Date('2026-03-28T00:00:00')
            },
            Action: 'LOGIN'
        });
        expect(res.render).toHaveBeenCalledWith('admin-auth-logs', {
            logs: logs,
            selectedDate: '2026-03-27',
            selectedAction: 'LOGIN'
        });
    });

    it('should handle audit log lookup errors gracefully', async () => {
        database.findMany.mockRejectedValue(new Error('Database Error'));

        await admin_auth_logs_controller.get_auth_logs(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith('Internal Server Error!');
    });
});
