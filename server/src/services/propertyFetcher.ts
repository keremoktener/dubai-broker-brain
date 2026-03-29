export interface MockProperty {
  id: string;
  name: string;
  developer: string;
  area: string;
  type: string;
  price: number;
  bedrooms: number;
  sizeSqft: number;
  completionYear: number;
  highlights: string[];
  roiEstimate: number; // annual %
}

export function getMockProperties(): MockProperty[] {
  return [
    {
      id: 'prop-001',
      name: 'Emaar Beachfront – Marina Vista Tower 2',
      developer: 'Emaar Properties',
      area: 'Dubai Harbour',
      type: 'apartment',
      price: 3_200_000,
      bedrooms: 2,
      sizeSqft: 1_180,
      completionYear: 2026,
      highlights: [
        'Direct beachfront access on 1.5km private beach',
        'Panoramic views of Dubai Marina skyline',
        'Emaar branded hotel amenities & concierge',
        'Off-plan — 60/40 payment plan available',
      ],
      roiEstimate: 7.2,
    },
    {
      id: 'prop-002',
      name: 'DAMAC Cavalli Couture – Sky Mansion',
      developer: 'DAMAC Properties',
      area: 'Business Bay',
      type: 'penthouse',
      price: 12_500_000,
      bedrooms: 5,
      sizeSqft: 6_800,
      completionYear: 2025,
      highlights: [
        'Roberto Cavalli branded interiors — gold & marble finishes',
        'Private rooftop infinity pool with Burj Khalifa views',
        'Butler service, 4 parking spaces, smart home system',
        'Ready to move in — immediate occupancy',
      ],
      roiEstimate: 5.8,
    },
    {
      id: 'prop-003',
      name: 'Nakheel Rixos Palm Residences',
      developer: 'Nakheel',
      area: 'Palm Jumeirah',
      type: 'villa',
      price: 8_900_000,
      bedrooms: 4,
      sizeSqft: 4_200,
      completionYear: 2025,
      highlights: [
        'Frond villa on Palm Jumeirah with private beach',
        'Rixos hotel access — spa, restaurants, beach club',
        'Gated community with 24/7 security',
        'Capital appreciation avg 18% over last 3 years on Palm',
      ],
      roiEstimate: 6.5,
    },
  ];
}
