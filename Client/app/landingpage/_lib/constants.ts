import {
  Crown,
  Dices,
  Gamepad2,
  Ghost,
  Puzzle,
  Swords,
  Target,
  Trophy,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Games", href: "#games" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Arena", href: "#arena" },
  { label: "Reviews", href: "#reviews" },
  { label: "Membership", href: "#membership" },
];

export const STATS = [
  { value: "50+", label: "Game stations" },
  { value: "10+", label: "Game zones" },
  { value: "24/7", label: "Arena access" },
  { value: "4.9", label: "Player rating" },
];

export const GAMES = [
  { icon: Crown, name: "Chess", blurb: "Tournament boards & coaching nights." },
  { icon: Target, name: "Darts", blurb: "Electronic boards with auto scoring." },
  { icon: Dices, name: "Carrom", blurb: "Pro-grade boards, singles & doubles." },
  { icon: Trophy, name: "Pool", blurb: "Championship tables under arena lights." },
  { icon: Gamepad2, name: "PS5 Zone", blurb: "4K pods with the latest titles." },
  { icon: Ghost, name: "Retro Arcade", blurb: "Classic cabinets, endless credits." },
  { icon: Swords, name: "Table Tennis", blurb: "Competition paddles & ranked ladders." },
  { icon: Puzzle, name: "Board Games", blurb: "100+ titles from party to strategy." },
];

export const STEPS = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Sign up in seconds and pick a membership — or play as a guest.",
  },
  {
    step: "02",
    title: "Book your station",
    description:
      "Choose a game zone, pick a slot, and lock in your table instantly.",
  },
  {
    step: "03",
    title: "Play & climb",
    description:
      "Scan in, grab your gear, and start stacking wins on the leaderboard.",
  },
];

export const FEATURES = [
  {
    title: "Member pricing",
    description: "Automatic discounts applied to every single booking.",
  },
  {
    title: "Instant booking",
    description: "Reserve a game session in a few clicks — no queues.",
  },
  {
    title: "Secure sessions",
    description: "JWT-based authentication keeps your account locked down.",
  },
];

export const TIERS = [
  {
    name: "Day Pass",
    price: "₹199",
    period: "/ day",
    tag: "Casual",
    featured: false,
    perks: ["Full arena access", "1 game zone", "Standard seating", "Pay as you go"],
  },
  {
    name: "Member",
    price: "₹999",
    period: "/ month",
    tag: "Most played",
    featured: true,
    perks: [
      "All game zones",
      "Priority booking",
      "20% off every session",
      "Leaderboard access",
    ],
  },
  {
    name: "Squad",
    price: "₹2,499",
    period: "/ month",
    tag: "4 players",
    featured: false,
    perks: [
      "Everything in Member",
      "Private squad table",
      "Free tournament entry",
      "Guest passes ×2",
    ],
  },
];


