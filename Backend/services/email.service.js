// services/email.service.js

const resend = require('../config/resend');

const FROM = process.env.RESEND_FROM || 'BloodConnect <onboarding@resend.dev>';

// ── Helper ────────────────────────────────────────────────────

function row(label, value) {
    return `
        <tr>
            <td style="padding:0.4rem 0;color:#64748b;font-size:0.85rem;width:40%">${label}</td>
            <td style="padding:0.4rem 0;color:#e2e8f0;font-size:0.85rem">${value}</td>
        </tr>
    `;
}

function emailWrapper(body) {
    return `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:2rem;
                    background:#1a0a0a;border-radius:12px;color:#e2e8f0;">
            <h2 style="color:#f87171;margin:0 0 0.25rem;">🩸 BloodConnect</h2>
            <p style="color:#94a3b8;font-size:0.85rem;margin:0 0 1.5rem;">Hospital Registration</p>
            ${body}
            <p style="color:#64748b;font-size:0.78rem;margin-top:1.5rem;">
                This is an automated message from the BloodConnect platform.
            </p>
        </div>
    `;
}

// ── Blood Request Notification to Donor ──────────────────────

const sendBloodRequestEmail = async (donor, request, hospital) => {
    const emergencyColor = {
        critical: '#ef4444',
        high:     '#f97316',
        medium:   '#eab308',
        low:      '#22c55e',
    }[request.emergency_level] || '#f87171';

    const { error } = await resend.emails.send({
        from:    FROM,
        to:      [donor.email],
        subject: `🩸 Urgent Blood Request - ${request.blood_group} needed at ${hospital.hospital_name}`,
        html:    emailWrapper(`
            <div style="background:#2a1010;border-radius:10px;padding:1.25rem;
                        border-left:4px solid ${emergencyColor};margin-bottom:1.25rem;">
                <p style="margin:0 0 0.25rem;color:#94a3b8;font-size:0.8rem;text-transform:uppercase;">
                    Emergency Level
                </p>
                <p style="margin:0;color:${emergencyColor};font-size:1rem;font-weight:700;text-transform:uppercase;">
                    ${request.emergency_level}
                </p>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:1.25rem;">
                ${row('Hospital',     hospital.hospital_name)}
                ${row('Address',      hospital.hospital_address)}
                ${row('Contact',      hospital.contact_number)}
                ${row('Blood Group',  `<strong style="color:#f87171">${request.blood_group}</strong>`)}
                ${row('Units Needed', request.units_needed)}
                ${row('Location',     request.location)}
                ${row('Description',  request.description || '—')}
            </table>

            <p style="color:#64748b;font-size:0.82rem;margin-top:1rem;">
                Log in to BloodConnect to accept or decline this request.
            </p>
        `),
    });

    if (error) throw new Error(`Email send failed: ${error.message}`);
};

// ── FIX: Hospital Approval Email (was missing) ────────────────

const sendHospitalApprovalEmail = async (email, hospitalName) => {
    const { error } = await resend.emails.send({
        from:    FROM,
        to:      [email],
        subject: `✅ Your Hospital Registration Has Been Approved — BloodConnect`,
        html:    emailWrapper(`
            <div style="background:#0a2a0a;border-radius:10px;padding:1.25rem;
                        border-left:4px solid #22c55e;margin-bottom:1.25rem;">
                <p style="margin:0;color:#22c55e;font-size:1rem;font-weight:700;">
                    Registration Approved
                </p>
            </div>

            <p style="color:#e2e8f0;">Dear <strong>${hospitalName}</strong>,</p>
            <p style="color:#cbd5e1;">
                We are pleased to inform you that your hospital registration on
                <strong style="color:#f87171;">BloodConnect</strong> has been
                <strong style="color:#22c55e;">approved</strong>.
            </p>
            <p style="color:#cbd5e1;">
                You can now log in using your registered email and password to
                access the hospital dashboard, post blood requests, and manage donations.
            </p>

            <div style="margin-top:1.5rem;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login"
                   style="display:inline-block;background:#f87171;color:#fff;
                          padding:0.65rem 1.5rem;border-radius:8px;
                          text-decoration:none;font-weight:600;">
                    Login to BloodConnect
                </a>
            </div>
        `),
    });

    if (error) throw new Error(`Approval email failed: ${error.message}`);
};

// ── FIX: Hospital Rejection Email (was missing) ───────────────

const sendHospitalRejectionEmail = async (email, hospitalName, reason) => {
    const { error } = await resend.emails.send({
        from:    FROM,
        to:      [email],
        subject: `❌ Hospital Registration Update — BloodConnect`,
        html:    emailWrapper(`
            <div style="background:#2a0a0a;border-radius:10px;padding:1.25rem;
                        border-left:4px solid #ef4444;margin-bottom:1.25rem;">
                <p style="margin:0;color:#ef4444;font-size:1rem;font-weight:700;">
                    Registration Not Approved
                </p>
            </div>

            <p style="color:#e2e8f0;">Dear <strong>${hospitalName}</strong>,</p>
            <p style="color:#cbd5e1;">
                After reviewing your hospital registration, we regret to inform you
                that your application has <strong style="color:#ef4444;">not been approved</strong>
                at this time.
            </p>

            ${reason ? `
            <div style="background:#1e1010;border-radius:8px;padding:1rem;margin:1rem 0;">
                <p style="margin:0 0 0.4rem;color:#94a3b8;font-size:0.8rem;text-transform:uppercase;">
                    Reason
                </p>
                <p style="margin:0;color:#fca5a5;">${reason}</p>
            </div>
            ` : ''}

            <p style="color:#cbd5e1;">
                If you believe this is an error or have additional documentation to
                provide, please contact our support team.
            </p>
        `),
    });

    if (error) throw new Error(`Rejection email failed: ${error.message}`);
};

module.exports = {
    sendBloodRequestEmail,
    sendHospitalApprovalEmail,   // FIX: now exported
    sendHospitalRejectionEmail,  // FIX: now exported
};
