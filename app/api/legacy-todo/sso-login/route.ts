import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { readJSON, writeJSON } = require('@/lib/legacy-todo/handlers/_lib/store');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { signToken, hashPassword } = require('@/lib/legacy-todo/handlers/_lib/auth');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');

// Single sign-on bridge for the To-Do List tracker: this page only ever
// loads inside an iframe on a route that's already gated by this app's own
// NextAuth session (see middleware.ts + lib/permissions.ts), so by the time
// someone reaches it we already know who they are. This mirrors
// ms-login.js's matching/auto-provision logic exactly (same employee/user
// shape, same auto-provision-as-lowest-privilege-employee fallback), but
// the verified identity comes from that existing session instead of a
// fresh Microsoft Graph accessToken -- so no second Microsoft popup is
// needed to land inside the tracker as yourself.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }
  const email = session.user.email.toLowerCase();
  const name = (session.user as any).name || null;
  const localPart = email.split('@')[0];

  const [users, employees, managers, idSeq] = await Promise.all([
    readJSON('users', []),
    readJSON('employees', []),
    readJSON('managers', []),
    readJSON('idSeq', { task: 1, personalTask: 1, employee: 1 })
  ]);

  function emailOfUser(u: any) {
    if (u.role === 'employee') {
      const emp = employees.find((e: any) => e.id === u.employeeId);
      return emp && emp.email ? emp.email.toLowerCase() : null;
    }
    if (u.role === 'manager') {
      const mgr = managers.find((m: any) => m.id === u.managerId);
      const linkedEmp = mgr && mgr.employeeId ? employees.find((e: any) => e.id === mgr.employeeId) : null;
      return linkedEmp && linkedEmp.email ? linkedEmp.email.toLowerCase() : null;
    }
    return null;
  }

  let user = users.find((u: any) => {
    const uEmail = emailOfUser(u);
    if (uEmail && uEmail === email) return true;
    return u.username === localPart;
  });

  let employee: any = null;

  if (!user) {
    // Auto-provision: new employee record + user record, lowest-privilege
    // role -- same as ms-login.js. An admin can promote them from the
    // Employees page afterward.
    const id = idSeq.employee;
    employee = {
      id, code: 'EMP' + String(id).padStart(3, '0'),
      name: name || localPart,
      email, dept: 'Unassigned', client: '', designation: 'Associate', active: true,
      managerId: null
    };
    employees.push(employee);
    idSeq.employee = id + 1;

    let username = localPart;
    if (users.some((u: any) => u.username === username)) {
      username = username + id;
    }
    user = {
      id: users.length ? Math.max(...users.map((u: any) => u.id)) + 1 : 1,
      username, role: 'employee', employeeId: id,
      passwordHash: hashPassword(crypto.randomBytes(24).toString('hex'))
    };
    users.push(user);

    await Promise.all([
      writeJSON('employees', employees),
      writeJSON('users', users),
      writeJSON('idSeq', idSeq)
    ]);
  }

  if (user.role === 'employee') {
    employee = employee || employees.find((e: any) => e.id === user.employeeId) || null;
    if (employee && employee.active === false) {
      return NextResponse.json({ error: 'This account has been deactivated. Contact your administrator.' }, { status: 403 });
    }
  }

  let manager: any = null;
  if (user.role === 'manager') {
    manager = managers.find((m: any) => m.id === user.managerId) || null;
    if (manager && manager.active === false) {
      return NextResponse.json({ error: 'This manager account has been deactivated. Contact your administrator.' }, { status: 403 });
    }
  }

  const linkedEmployeeId = user.role === 'manager' && manager ? manager.employeeId || null : user.employeeId;
  const token = signToken({ userId: user.id, role: user.role, employeeId: linkedEmployeeId, managerId: user.managerId, username: user.username });
  return NextResponse.json({ token, role: user.role, username: user.username, employee, manager });
}
