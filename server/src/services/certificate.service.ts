import crypto from 'crypto';

export interface CertificateMetadata {
  certificateId: string;
  userName: string;
  categoryName: string;
  issuedAt: string;
  qrCodeUrl: string;
  svgContent: string;
}

export const generateCertificateData = (
  userName: string,
  categoryName: string,
  verificationHost: string = 'http://localhost:3000'
): CertificateMetadata => {
  const certificateId = crypto.randomUUID();
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const verificationUrl = `${verificationHost}/verify-certificate/${certificateId}`;
  
  // Create a stylized vector QR code grid in SVG
  const qrGrid = Array.from({ length: 15 }, () => 
    Array.from({ length: 15 }, () => Math.random() > 0.4 ? '1' : '0')
  );
  // Overlay markers on corners
  const setMarker = (x: number, y: number) => {
    for(let i=0; i<4; i++){
      for(let j=0; j<4; j++){
        qrGrid[y+i][x+j] = (i===0 || i===3 || j===0 || j===3) ? '1' : '0';
      }
    }
  };
  setMarker(0, 0);
  setMarker(11, 0);
  setMarker(0, 11);

  let qrSvgElements = '';
  for(let y=0; y<15; y++){
    for(let x=0; x<15; x++){
      if(qrGrid[y][x] === '1'){
        qrSvgElements += `<rect x="${x * 4}" y="${y * 4}" width="4" height="4" fill="#0B0F19"/>`;
      }
    }
  }

  const qrCodeSvg = `
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" fill="#FFFFFF" rx="4"/>
      <g transform="translate(0, 0)">
        ${qrSvgElements}
      </g>
    </svg>
  `;

  const qrCodeUrl = `data:image/svg+xml;utf8,${encodeURIComponent(qrCodeSvg)}`;

  // Premium vector SVG Certificate
  const svgContent = `
    <svg width="842" height="595" viewBox="0 0 842 595" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background Gradient -->
      <rect width="842" height="595" fill="#070A13"/>
      <rect width="842" height="595" fill="url(#bg-gradient)" opacity="0.1"/>
      
      <!-- Techy Geometric Borders -->
      <rect x="20" y="20" width="802" height="555" rx="8" border="1px" stroke="url(#border-gradient)" stroke-width="2"/>
      <rect x="30" y="30" width="782" height="535" rx="6" border="1px" stroke="#8B5CF6" stroke-opacity="0.2" stroke-width="1"/>
      
      <!-- Corner Highlights -->
      <path d="M 20 60 L 20 20 L 60 20" stroke="#EC4899" stroke-width="4" fill="none"/>
      <path d="M 822 60 L 822 20 L 782 20" stroke="#8B5CF6" stroke-width="4" fill="none"/>
      <path d="M 20 535 L 20 575 L 60 575" stroke="#6366F1" stroke-width="4" fill="none"/>
      <path d="M 822 535 L 822 575 L 782 575" stroke="#3B82F6" stroke-width="4" fill="none"/>
      
      <!-- Top Crest -->
      <g transform="translate(421, 80)">
        <polygon points="0,-25 22,-5 13,20 -13,20 -22,-5" fill="url(#crest-gradient)"/>
        <text x="0" y="3" font-family="'Outfit', 'Inter', sans-serif" font-weight="bold" font-size="12" fill="#FFFFFF" text-anchor="middle">AILP</text>
      </g>

      <!-- Main Header Text -->
      <text x="421" y="160" font-family="'Outfit', 'Inter', sans-serif" font-weight="800" font-size="28" fill="url(#text-gradient)" text-anchor="middle" letter-spacing="4">CERTIFICATE OF EXCELLENCE</text>
      <text x="421" y="195" font-family="'Inter', sans-serif" font-weight="300" font-size="14" fill="#94A3B8" text-anchor="middle">PROUDLY PRESENTED TO</text>
      
      <!-- Candidate Name -->
      <text x="421" y="260" font-family="'Outfit', 'Inter', sans-serif" font-weight="700" font-size="36" fill="#FFFFFF" text-anchor="middle">${userName.toUpperCase()}</text>
      <line x1="250" y1="280" x2="592" y2="280" stroke="url(#line-gradient)" stroke-width="2"/>
      
      <!-- Accomplishment -->
      <text x="421" y="325" font-family="'Inter', sans-serif" font-weight="400" font-size="16" fill="#E2E8F0" text-anchor="middle">for successfully completing the core training curriculum in</text>
      <text x="421" y="360" font-family="'Outfit', 'Inter', sans-serif" font-weight="700" font-size="22" fill="#EC4899" text-anchor="middle">${categoryName}</text>
      <text x="421" y="390" font-family="'Inter', sans-serif" font-weight="300" font-size="14" fill="#94A3B8" text-anchor="middle">with top-tier placement readiness index on the AI Learning platform</text>
      
      <!-- Footer Metadata / Signatures -->
      <g transform="translate(100, 470)">
        <text x="0" y="0" font-family="'Inter', sans-serif" font-weight="400" font-size="14" fill="#FFFFFF">AI Tutor System</text>
        <line x1="0" y1="-10" x2="120" y2="-10" stroke="#475569" stroke-width="1"/>
        <text x="0" y="20" font-family="'Inter', sans-serif" font-weight="300" font-size="11" fill="#64748B">ISSUED ON: ${dateStr}</text>
      </g>

      <g transform="translate(680, 440)">
        ${qrCodeSvg}
        <text x="30" y="75" font-family="'Inter', sans-serif" font-weight="300" font-size="8" fill="#64748B" text-anchor="middle">SCAN TO VERIFY</text>
      </g>
      
      <g transform="translate(421, 510)">
        <text x="0" y="0" font-family="'Inter', sans-serif" font-weight="300" font-size="11" fill="#64748B" text-anchor="middle">Certificate ID: ${certificateId}</text>
        <text x="0" y="15" font-family="'Inter', sans-serif" font-weight="300" font-size="9" fill="#475569" text-anchor="middle">Verify at: ${verificationUrl}</text>
      </g>

      <!-- Gradients Definition -->
      <defs>
        <linearGradient id="bg-gradient" x1="0" y1="0" x2="842" y2="595" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#EC4899"/>
        </linearGradient>
        <linearGradient id="border-gradient" x1="0" y1="0" x2="842" y2="595" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#8B5CF6"/>
          <stop offset="50%" stop-color="#6366F1"/>
          <stop offset="100%" stop-color="#EC4899"/>
        </linearGradient>
        <linearGradient id="text-gradient" x1="0" y1="0" x2="842" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="30%" stop-color="#8B5CF6"/>
          <stop offset="70%" stop-color="#EC4899"/>
        </linearGradient>
        <linearGradient id="crest-gradient" x1="-22" y1="-25" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#6366F1"/>
        </linearGradient>
        <linearGradient id="line-gradient" x1="250" y1="280" x2="592" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0"/>
          <stop offset="50%" stop-color="#EC4899" stop-opacity="1"/>
          <stop offset="100%" stop-color="#6366F1" stop-opacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  `;

  return {
    certificateId,
    userName,
    categoryName,
    issuedAt: new Date().toISOString(),
    qrCodeUrl,
    svgContent,
  };
};
