const clubs = [
  {
    name: "A Cappella Club",
    description:
      "Join our vibrant a cappella community where students come together to create beautiful harmonies and perform amazing vocal arrangements without instruments.",
    baddyProbability: 0.7,
    url: "https://clubs.byu.edu/link/Clubs/BYUAC3",
    image: `${process.env.PUBLIC_URL}/images/clubs/a_cappella_club.png`,
    cost: "Free",
    time: "Tuesdays 7:00 PM - 8:00 PM",
  },
  {
    name: "Exercise Clubs",
    description:
      "Stay physically active while building meaningful friendships through various exercise activities including gymnastics, pickleball, and yoga sessions designed for all skill levels.",
    baddyProbability: 0.79,
    cost: "Varies",
    image: `${process.env.PUBLIC_URL}/images/clubs/exercise_club.png`,
    subClubs: [
      {
        name: "Gymnastics",
        url: "https://clubs.byu.edu/link/Clubs/Gymnastics",
      },
      {
        name: "Pickleball",
        url: "https://clubs.byu.edu/link/Clubs/BYUPC2",
      },
      {
        name: "Yoga",
        url: "https://clubs.byu.edu/link/Clubs/Downwardcougar",
      },
    ],
  },
]

export default clubs
