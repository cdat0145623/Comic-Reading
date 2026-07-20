import nodemailer from "nodemailer";

const REQUIRED_SMTP_VARIABLES = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "EMAIL_FROM",
];

let transporter;

function getAppUrl() {
    return (process.env.APP_URL || process.env.NEXTAUTH_URL || "").replace(
        /\/$/,
        "",
    );
}

export function getMissingSmtpVariables() {
    return REQUIRED_SMTP_VARIABLES.filter(
        (name) => !process.env[name]?.trim(),
    );
}

export function getMailTransport() {
    const missing = getMissingSmtpVariables();
    if (missing.length > 0) return null;
    if (transporter) return transporter;

    const port = Number(process.env.SMTP_PORT);
    if (!Number.isInteger(port) || port <= 0) return null;

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    return transporter;
}

export async function verifyMailTransport() {
    const mailTransport = getMailTransport();
    if (!mailTransport) {
        return {
            verified: false,
            reason: "EMAIL_SERVICE_NOT_CONFIGURED",
            missing: getMissingSmtpVariables(),
        };
    }
    await mailTransport.verify();
    return { verified: true };
}

export async function sendMail({ to, subject, text, html }) {
    const mailTransport = getMailTransport();
    if (!mailTransport) {
        return { sent: false, reason: "EMAIL_SERVICE_NOT_CONFIGURED" };
    }

    const info = await mailTransport.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: info.accepted.length > 0 && info.rejected.length === 0,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
    };
}

export function buildVerificationUrl(token) {
    return `${getAppUrl()}/xac-minh-email?token=${encodeURIComponent(token)}`;
}

export function buildPasswordResetUrl(token) {
    return `${getAppUrl()}/dat-lai-mat-khau?token=${encodeURIComponent(token)}`;
}

export function buildEmailChangeUrl(token) {
    return `${getAppUrl()}/xac-minh-email-moi?token=${encodeURIComponent(token)}`;
}

export function sendVerificationEmail({ email, token }) {
    const url = buildVerificationUrl(token);
    return sendMail({
        to: email,
        subject: "Xác minh email Me Truyện Chữ",
        text: `Mở liên kết sau để xác minh email. Liên kết hết hạn sau 24 giờ: ${url}`,
        html: `<p>Xác minh email để bảo vệ tài khoản của bạn.</p><p><a href="${url}">Xác minh email</a></p><p>Liên kết hết hạn sau 24 giờ.</p>`,
    });
}

export function sendPasswordResetEmail({ email, token }) {
    const url = buildPasswordResetUrl(token);
    return sendMail({
        to: email,
        subject: "Đặt lại mật khẩu Me Truyện Chữ",
        text: `Mở liên kết sau để đặt lại mật khẩu. Liên kết hết hạn sau 30 phút: ${url}`,
        html: `<p>Bạn đã yêu cầu đặt lại mật khẩu.</p><p><a href="${url}">Đặt lại mật khẩu</a></p><p>Liên kết hết hạn sau 30 phút. Bỏ qua email nếu bạn không thực hiện yêu cầu này.</p>`,
    });
}

export function sendEmailChangeVerification({ email, token }) {
    const url = buildEmailChangeUrl(token);
    return sendMail({
        to: email,
        subject: "Xác nhận email mới Me Truyện Chữ",
        text: `Mở liên kết sau để xác nhận email mới. Liên kết hết hạn sau 24 giờ: ${url}`,
        html: `<p>Bạn đã yêu cầu dùng địa chỉ này cho tài khoản Me Truyện Chữ.</p><p><a href="${url}">Xác nhận email mới</a></p><p>Liên kết hết hạn sau 24 giờ. Bỏ qua email nếu bạn không thực hiện yêu cầu này.</p>`,
    });
}

export function sendEmailChangedNotice({ email, newEmail }) {
    return sendMail({
        to: email,
        subject: "Email tài khoản Me Truyện Chữ đã thay đổi",
        text: `Email đăng nhập của tài khoản đã được đổi sang ${newEmail}. Hãy đặt lại mật khẩu ngay nếu bạn không thực hiện thay đổi này.`,
        html: `<p>Email đăng nhập của tài khoản đã được đổi sang <strong>${newEmail}</strong>.</p><p>Hãy đặt lại mật khẩu ngay nếu bạn không thực hiện thay đổi này.</p>`,
    });
}
