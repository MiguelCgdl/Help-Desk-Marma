import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = jwt.JwtPayload & { role?: string; companyId?: string };

/** Panel administrador: rechaza tokens de portal empresa */
export const protectAdmin = (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        token = token.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
            if (decoded.role === 'company') {
                res.status(403).json({ message: 'Requiere cuenta de administrador' });
                return;
            }
            (req as any).user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Token inválido' });
        }
    } else {
        res.status(401).json({ message: 'No autorizado' });
    }
};

/** Portal empresa: solo JWT emitido en /auth/company-login */
export const protectCompany = (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        token = token.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
            if (decoded.role !== 'company' || !decoded.companyId) {
                res.status(403).json({ message: 'Acceso solo para empresas registradas' });
                return;
            }
            (req as any).companyId = decoded.companyId;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Token inválido' });
        }
    } else {
        res.status(401).json({ message: 'No autorizado' });
    }
};

/** POST tickets: si viene JWT de empresa, fija companyId desde el token */
export const optionalCompanyAuth = (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        token = token.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
            if (decoded.role === 'company' && decoded.companyId) {
                (req as any).companyIdFromToken = decoded.companyId;
            }
        } catch {
            /* token inválido: se trata como reporte público (sin empresa en token) */
        }
    }
    next();
};