const resend = require('../config/resend');

const FROM = process.env.RESEND_FROM || 'BloodConnect <onboarding@resend.dev>';

// ── Blood Request Notification to Donor ──────────────────────
const sendBloodRequestEmail = async (donor, request, hospital) => {
    const emergencyColor = {
        critical: '#ef4444',
        high:     '#f97316',
        medium:   '#eab308',
        low:      '#22c55e',
    }[request.emergency_level] || '#f87171';

    const { error } = await resend.emails.send({
        from: FROM,
        to: [donor.email],
        subject: `🩸 Urgent Blood Request - ${request.blood_group} needed at ${hospital.hospital_name}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:2rem;
                        background:#1a0a0a;border-radius:12px;color:#e2e8f0;">
                <h2 style="color:#f87171;margin:0 0 0.25rem;">🩸 BloodConnect</h2>
                <p style="color:#94a3b8;font-size:0.85rem;margin:0 0 1.5rem;">Blood Donation Request</p>

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
                    ${row('Hospital',      hospital.hospital_name)}
                    ${row('Address',       hospital.hospital_address)}
                    ${row('Contact',       hospital.contact_number)}
                    ${row('Blood Group',   `<strong style="color:#f87171">${request.blood_group}</strong>`)}
                    ${row('Units Needed',  request.units_needed)}
                    ${row('Location',      request.location)}
                    ${row('Description',   request.description || '—')}
                </table>

                <p style="color:#64748b;font-size:0.82rem;margin-top:1rem;">
                    Log in to BloodConnect to accept or decline this request.
                </p>
            </div>
        `,
    });
    if (error) throw new Error(`Email send failed: ${error.message}`);
};

function row(label, value) {
    return `
        <tr>
            <td style="padding:0.4rem 0;color:#64748b;font-size:0.85rem;width:40%">${label}</td>
            <td style="padding:0.4rem 0;color:#e2e8f0;font-size:0.85rem">${value}</td>
        </tr>
    `;
}

module.exports = { sendBloodRequestEmail };
