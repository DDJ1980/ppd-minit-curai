import jwt from 'jsonwebtoken';

export default function handler(request, response) {
    console.log('Fungsi auth-login dimulakan.'); // Lampu suluh #1

    if (request.method !== 'POST') {
        console.log('Kaedah bukan POST. Ditolak.');
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        console.log('Mencuba membaca badan permintaan...'); // Lampu suluh #2
        
        // Inilah pembetulan utama berdasarkan log Vercel.
        // Vercel menghantar data dalam `request.body`.
        const { ic, password } = request.body;
        
        console.log(`Data diterima: IC=${ic}, Password=${password ? '***' : 'tiada'}`); // Lampu suluh #3

        if (!ic || !password) {
            console.log('IC atau Kata Laluan tiada.');
            return response.status(400).json({ error: 'Sila masukkan ID Pengguna dan Kata Laluan.' });
        }

        const adminIc = process.env.ADMIN_IC;
        const adminPass = process.env.ADMIN_PASS;
        console.log('Mengambil butiran admin dari Env Vars.'); // Lampu suluh #4

        if (ic === adminIc && password === adminPass) {
            console.log('Pengesahan berjaya. Mencipta token...'); // Lampu suluh #5
            const token = jwt.sign(
                { ic: adminIc, role: 'admin', name: 'Pentadbir Sistem' },
                'secret-key-for-jwt-2025',
                { expiresIn: '8h' }
            );
            console.log('Token dicipta. Menghantar jawapan berjaya.'); // Lampu suluh #6
            return response.status(200).json({ 
                message: 'Log masuk berjaya!',
                token: token,
                role: 'admin'
            });
        } else {
            console.log('Pengesahan gagal. IC atau Kata Laluan tidak sepadan.');
            return response.status(401).json({ error: 'ID Pengguna atau Kata Laluan tidak sah.' });
        }

    } catch (error) {
        console.error('RALAT KRITIKAL DALAM AUTH-LOGIN:', error);
        return response.status(500).json({ error: 'Berlaku ralat pada pelayan.' });
    }
}

