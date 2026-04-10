import nodemailer from 'nodemailer';

export const sendTicketResolutionEmail = async (to: string, ticketNumber: string, comments: string, companyName: string) => {
    // Standard transport depending on .env
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // If no user configured, just log
    if (!process.env.SMTP_USER) {
        console.log(`[MAILER MOCK] Correo simulado a ${to}`);
        console.log(`========================================`);
        console.log(`Asunto: Resolución de Ticket ${ticketNumber}`);
        console.log(`Mensaje: Su ticket ${ticketNumber} ha sido resuelto.`);
        if (comments) console.log(`Comentarios del agente: ${comments}`);
        console.log(`========================================`);
        return true; 
    }

    const mailOptions = {
        from: `"Marmacore HelpDesk" <${process.env.SMTP_USER}>`,
        to,
        subject: `Notificación: Su ticket ${ticketNumber} ha sido RESUELTO`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #00272e; max-w: 600px; margin: auto;">
                <h2 style="color: #FD5200; text-align: center;">Marmacore HelpDesk</h2>
                <div style="background-color: #f8fafb; padding: 20px; border-radius: 8px; border: 1px solid #d5eff2;">
                    <p style="font-size: 16px;">Hola <strong>${companyName}</strong>,</p>
                    <p>Le notificamos que el ticket con folio <strong>#${ticketNumber}</strong> ha sido marcado como <strong>RESUELTO</strong> por nuestro equipo de soporte técnico.</p>
                    ${comments ? `
                    <div style="background-color: #fff; padding: 15px; border-left: 4px solid #006D65; margin-top: 15px; margin-bottom: 15px;">
                        <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Comentarios del Agente:</p>
                        <p style="margin: 10px 0 0 0; font-style: italic;">"${comments}"</p>
                    </div>
                    ` : ''}
                    <p style="font-size: 14px;">Puede consultar el reporte final y su facturación mensual en su portal de empresas.</p>
                    <br/>
                    <p style="font-size: 12px; color: #999;">Alcanzando la gravedad cero con Marmacore.</p>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email enviado con éxito a ${to}`);
        return true;
    } catch (error) {
        console.error('Error al enviar correo:', error);
        return false;
    }
};
