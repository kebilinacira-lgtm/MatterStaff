import React from 'react';

export const OfficialFooter: React.FC = () => {
  return (
    <div className="w-full mt-4 select-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 850 120"
        className="w-full h-auto block"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <style>{`
            .txt-ar { font-family: 'Amiri', 'Times New Roman', serif; font-weight: bold; }
            .txt-sans { font-family: Arial, Helvetica, sans-serif; font-weight: bold; }
          `}</style>
        </defs>

        {/* Outer Rectangular Frame */}
        <rect x="1" y="1" width="848" height="118" fill="#ffffff" stroke="#000000" strokeWidth="2" />

        {/* Upper Section: Left side Logos */}
        <g transform="translate(14, 4)">
          {/* 1. Intertek ISO 9001:2015 Globe Badge */}
          <g transform="translate(4, 0)">
            <path id="isoCurveTopInline" d="M 6,21 A 23,23 0 0,1 46,21" fill="none" />
            <text fontSize="6.5" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#231f20">
              <textPath href="#isoCurveTopInline" startOffset="50%">ISO 9001:2015</textPath>
            </text>

            <path d="M 6,24 A 23,23 0 0,0 6,48" fill="none" stroke="#231f20" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M 46,24 A 23,23 0 0,1 46,48" fill="none" stroke="#231f20" strokeWidth="2.6" strokeLinecap="round" />

            <circle cx="26" cy="35" r="14.5" fill="none" stroke="#231f20" strokeWidth="1.8" />
            <ellipse cx="26" cy="35" rx="7" ry="14.5" fill="none" stroke="#231f20" strokeWidth="1.5" />
            <line x1="26" y1="20.5" x2="26" y2="49.5" stroke="#231f20" strokeWidth="1.5" />
            <line x1="11.5" y1="35" x2="40.5" y2="35" stroke="#231f20" strokeWidth="1.5" />
            <line x1="14" y1="28" x2="38" y2="28" stroke="#231f20" strokeWidth="1.2" />
            <line x1="14" y1="42" x2="38" y2="42" stroke="#231f20" strokeWidth="1.2" />

            <path id="certCurveBottomInline" d="M 8,53 A 24,24 0 0,0 44,53" fill="none" />
            <text fontSize="5" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#231f20" letterSpacing="0.6">
              <textPath href="#certCurveBottomInline" startOffset="50%">CERTIFICATION</textPath>
            </text>

            <text x="51" y="60" fontSize="4.2" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" fill="#231f20">TM</text>
            <line x1="2" y1="64" x2="52" y2="64" stroke="#231f20" strokeWidth="2.6" strokeLinecap="round" />
            <text x="26" y="73" fontSize="11" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#231f20" letterSpacing="-0.5">intertek</text>
          </g>

          {/* 2. COFRAC Accreditation Badge */}
          <g transform="translate(68, 0)">
            <text x="32" y="10" fontSize="12" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#005ea8" letterSpacing="0.3">cofrac</text>
            <rect x="2" y="12" width="60" height="1.6" fill="#005ea8" />

            <g transform="translate(1, 15)">
              <polygon points="0,21 5,16 60,1 55,6" fill="#005ea8" />
              <polygon points="0,27 7,20 60,7 53,14" fill="#005ea8" />
              <polygon points="0,32 10,24 60,14 50,22" fill="#e30613" />
              <polygon points="0,38 12,28 60,18 48,28" fill="#e30613" />

              <polygon points="17,3 27,8 27,20 17,25 7,20 7,8" fill="#ffffff" stroke="#005ea8" strokeWidth="2.2" />
              <polygon points="34,10 44,15 44,27 34,32 24,27 24,15" fill="#ffffff" stroke="#e30613" strokeWidth="2.2" />
              <rect x="1" y="32" width="60" height="1.6" fill="#e30613" />
            </g>

            <text x="32" y="52" fontSize="4.5" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#e30613" letterSpacing="0.2">CERTIFICATION</text>
            <text x="32" y="56.5" fontSize="4.5" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#e30613" letterSpacing="0.2">DE SYSTEMES</text>
            <text x="32" y="61" fontSize="4.5" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#e30613" letterSpacing="0.2">DE MANAGEMENT</text>

            <text x="32" y="65" fontSize="3.6" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#000000">ACCRÉDITATION</text>
            <text x="32" y="68" fontSize="3.6" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#000000">COFRAC</text>
            <text x="32" y="71" fontSize="3.6" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#000000">N° 4-0641</text>
            <text x="32" y="74" fontSize="3.2" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#000000">PORTÉE</text>
            <text x="32" y="76.8" fontSize="3" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#000000">DISPONIBLE SUR</text>
            <text x="32" y="79.5" fontSize="3.2" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fill="#000000">www.cofrac.fr</text>
          </g>
        </g>

        {/* Upper Section: Middle/Right Contact Information */}
        <g transform="translate(500, 0)">
          <text x="0" y="36" fontSize="16" className="txt-ar" textAnchor="middle" fill="#000000" dir="rtl">
            جامعة قاصدي مرباح ورقلة، طريق غرداية، ص ب 511، 30000
          </text>
          <text x="0" y="62" fontSize="12.5" className="txt-sans" textAnchor="middle" fill="#000000" dir="ltr">
            / E-mail serviccpere2020@E-mail.dz : Tél : 029-71- 19- 02 / Fax : 029 -71 – 36 – 54
          </text>
        </g>

        {/* Middle Divider Line */}
        <line x1="1" y1="82" x2="849" y2="82" stroke="#000000" strokeWidth="2" />

        {/* Lower Section: 3 Columns partitioned by vertical dividers */}
        <line x1="285" y1="82" x2="285" y2="119" stroke="#000000" strokeWidth="2" />
        <line x1="565" y1="82" x2="565" y2="119" stroke="#000000" strokeWidth="2" />

        {/* Box 1 (Left): التاريخ :25/01/2026 */}
        <text x="142" y="106" fontSize="16" className="txt-ar" textAnchor="middle" fill="#000000" dir="rtl">
          التاريخ :25/01/2026
        </text>

        {/* Box 2 (Center): المراجعة :00 */}
        <text x="425" y="106" fontSize="16" className="txt-ar" textAnchor="middle" fill="#000000" dir="rtl">
          المراجعة :00
        </text>

        {/* Box 3 (Right): FOR.GRH.010 */}
        <text x="705" y="106" fontSize="17" className="txt-sans" textAnchor="middle" fill="#000000" dir="ltr">
          FOR.GRH.010
        </text>
      </svg>
    </div>
  );
};
