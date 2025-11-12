"use client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Nav from "./components/Nav";

const disasterTypeInfo = [
  {
    type: "Fire",
    description:
      "Wildfires and house fires can spread quickly. Stay alert and act fast.",
    supplies: [
      "Fire extinguisher",
      "Mask or cloth to cover mouth",
      "Important documents",
      "Water and first aid kit",
    ],
    actions: [
      "Know at least two exits in your home.",
      "Avoid smoke inhalation and stay low if indoors.",
      "Evacuate early if advised by authorities.",
    ],
  },
  {
    type: "Flood",
    description:
      "Flooding can occur from heavy rain, storms, or overflowing rivers.",
    supplies: [
      "Bottled water",
      "Waterproof clothing",
      "Flashlight with batteries",
      "Emergency radio",
    ],
    actions: [
      "Move to higher ground immediately.",
      "Avoid walking or driving through flood water.",
      "Turn off electricity if safe to do so.",
    ],
  },
  {
    type: "Earthquake",
    description:
      "Sudden shaking of the ground caused by movement along fault lines.",
    supplies: [
      "First aid kit",
      "Sturdy shoes",
      "Flashlight",
      "Whistle for signaling",
    ],
    actions: [
      "Drop, cover, and hold on during shaking.",
      "Stay away from windows and heavy objects.",
      "After shaking stops, move to open areas.",
    ],
  },
  {
    type: "Extreme Heat",
    description:
      "Prolonged high temperatures can cause heat exhaustion or stroke.",
    supplies: [
      "Water bottles",
      "Cool clothing",
      "Electrolyte drinks",
      "Cooling packs or fans",
    ],
    actions: [
      "Stay hydrated and avoid direct sun.",
      "Go to cooling centers or shaded areas.",
      "Never leave children or pets in vehicles.",
    ],
  },
  {
    type: "Hurricane",
    description:
      "Strong tropical storm with heavy rain and winds exceeding 75 mph.",
    supplies: [
      "Water and nonperishable food to last 3+ days",
      "Battery-powered radio",
      "Extra clothing and blankets",
      "Evacuation plan",
    ],
    actions: [
      "Follow evacuation orders immediately.",
      "Board up windows and secure outdoor items.",
      "Shelter in an interior room away from windows.",
    ],
  },
  {
    type: "Tornado",
    description:
      "Fast rotating air extending from a thunderstorm to the ground.",
    supplies: ["Flashlight", "Whistle", "Sturdy shoes"],
    actions: [
      "Go to a basement or interior room without windows.",
      "Cover your head and neck.",
      "Avoid mobile homes and vehicles.",
    ],
  },
  {
    type: "Tropical Storm",
    description: "Storm system with heavy rain and winds less than 75mph.",
    supplies: [
      "Emergency food and water",
      "Flashlight and radio",
      "Rain gear",
      "First aid kit",
    ],
    actions: [
      "Stay indoors during the storm.",
      "Avoid flooded areas and downed power lines.",
      "Listen to local weather alerts.",
    ],
  },
  {
    type: "Shooting",
    description:
      "An active shooter or gunfire situation can happen unexpectedly.",
    supplies: [
      "Phone for emergency contact",
      "First aid kit",
      "Knowledge of exits",
    ],
    actions: [
      "Run and escape if you can.",
      "Hide, lock doors, and silence phones.",
      "Fight only as a last resort.",
    ],
  },
  {
    type: "Auto Accident",
    description: "Car crashes can occur suddenly—be prepared for emergencies.",
    supplies: [
      "First aid kit",
      "Reflective triangle and flashlight",
      "Seatbelt cutter and window breaker",
      "Insurance information",
    ],
    actions: [
      "Check for injuries and call 911.",
      "Move vehicles out of traffic if safe.",
      "Document the scene and exchange information.",
    ],
  },
  {
    type: "Severe Storm",
    description:
      "Thunderstorms with strong winds, hail, and lightning can be dangerous.",
    supplies: [
      "Flashlight and batteries",
      "Battery-powered radio",
      "Blankets",
      "Water and snacks",
    ],
    actions: [
      "Stay indoors and avoid windows.",
      "Unplug electronics to prevent surges.",
      "Avoid flooded or damaged areas afterward.",
    ],
  },
  {
    type: "Other",
    description:
      "For any unexpected emergencies, general readiness helps protect you.",
    supplies: [
      "First aid kit",
      "Water and food",
      "Phone charger and emergency contacts",
    ],
    actions: [
      "Stay informed with local alerts.",
      "Prepare an all-purpose emergency plan.",
      "Check on family and neighbors.",
    ],
  },
];

export default function InfoPage() {
  return (
    <div className="p-4 bg-slate-50 min-h-screen font-inter text-slate-800">
      <Nav />
      <div className="mt-[3rem] flex justify-between items-center mb-2">
        <div
          className="text-left px-2 py-2"
          style={{ color: "#020617",fontSize: "28px", fontWeight: 600 }}
        >
          Disaster Preparedness Guide
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {disasterTypeInfo.map((item) => (
          <Card
            key={item.type}
            className="rounded-2xl border border-slate-200 shadow-sm bg-white"
          >
            <CardHeader className="flex flex justify-center">
              <Badge
                variant="disaster"
                className="flex items-center justify-center text-[24px] font-medium w-fit h-[48px] px-4 bg-white text-black border border-slate-300 shadow-sm"
              >
                {item.type}
              </Badge>
            </CardHeader>

            <CardContent className="text-sm text-slate-700 space-y-2">
              <p className="text-slate-800">{item.description}</p>

              <div>
                <h4 className="font-semibold text-slate-900 mt-2">Supplies</h4>
                <ul className="list-disc list-inside">
                  {item.supplies.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mt-2">Actions</h4>
                <ul className="list-disc list-inside">
                  {item.actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="text-center mt-10 text-xs text-slate-500">
        Information sourced from FEMA & Ready.gov. For the best information,
        follow local emergency alerts and officials.
      </footer>
      <footer className="text-center mt-5 text-xs text-slate-500">
        Made with love by Professor Sarac's Team 77 at the University of Texas
        at Dallas.
      </footer>
    </div>
  );
}
