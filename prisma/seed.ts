import { MatchPhase } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Limpando banco...");

  await prisma.prediction.deleteMany();
  await prisma.leagueMember.deleteMany();
  await prisma.league.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.user.deleteMany();

  console.log("Criando admin...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@bolao.com",
      password: hashedPassword,
      isSystemAdmin: true,
    },
  });

  console.log("Criando liga padrão...");

  const league = await prisma.league.create({
    data: {
      name: "Bolão Copa 2026",
      inviteCode: "COPA26",
      ownerId: admin.id,
    },
  });

  await prisma.leagueMember.create({
    data: {
      leagueId: league.id,
      userId: admin.id,
      role: "ADMIN",
    },
  });

  await prisma.appSetting.createMany({
    data: [
      {
        key: "predictions_locked",
        value: "false",
      },
      {
        key: "world_cup_started",
        value: "false",
      },
    ],
  });

  console.log("Criando times...");

  const groups = [
    {
      name: "A",
      teams: ["México", "África do Sul", "Coreia do Sul", "Repescagem UEFA D"],
    },
    {
      name: "B",
      teams: ["Canadá", "Suíça", "Qatar", "Repescagem UEFA A"],
    },
    {
      name: "C",
      teams: ["Brasil", "Marrocos", "Haiti", "Escócia"],
    },
    {
      name: "D",
      teams: ["Estados Unidos", "Paraguai", "Austrália", "Repescagem UEFA C"],
    },
  ];

  const teamsBySlot = new Map<string, string>();

  for (const group of groups) {
    for (let index = 0; index < group.teams.length; index++) {
      const slotCode = `${group.name}${index + 1}`;

      const team = await prisma.team.create({
        data: {
          name: group.teams[index],
          groupName: group.name,
          slotCode,
        },
      });

      teamsBySlot.set(slotCode, team.id);
    }
  }

  console.log("Criando jogos da fase de grupos...");

  const groupMatches = [
    // Grupo A
    { number: 1, groupName: "A", homeSlot: "A1", awaySlot: "A2" },
    { number: 2, groupName: "A", homeSlot: "A3", awaySlot: "A4" },
    { number: 25, groupName: "A", homeSlot: "A1", awaySlot: "A3" },
    { number: 26, groupName: "A", homeSlot: "A4", awaySlot: "A2" },
    { number: 49, groupName: "A", homeSlot: "A4", awaySlot: "A1" },
    { number: 50, groupName: "A", homeSlot: "A2", awaySlot: "A3" },

    // Grupo B
    { number: 3, groupName: "B", homeSlot: "B1", awaySlot: "B2" },
    { number: 4, groupName: "B", homeSlot: "B3", awaySlot: "B4" },
    { number: 27, groupName: "B", homeSlot: "B1", awaySlot: "B3" },
    { number: 28, groupName: "B", homeSlot: "B4", awaySlot: "B2" },
    { number: 51, groupName: "B", homeSlot: "B4", awaySlot: "B1" },
    { number: 52, groupName: "B", homeSlot: "B2", awaySlot: "B3" },

    // Grupo C
    { number: 5, groupName: "C", homeSlot: "C1", awaySlot: "C2" },
    { number: 6, groupName: "C", homeSlot: "C3", awaySlot: "C4" },
    { number: 29, groupName: "C", homeSlot: "C1", awaySlot: "C3" },
    { number: 30, groupName: "C", homeSlot: "C4", awaySlot: "C2" },
    { number: 53, groupName: "C", homeSlot: "C4", awaySlot: "C1" },
    { number: 54, groupName: "C", homeSlot: "C2", awaySlot: "C3" },

    // Grupo D
    { number: 7, groupName: "D", homeSlot: "D1", awaySlot: "D2" },
    { number: 8, groupName: "D", homeSlot: "D3", awaySlot: "D4" },
    { number: 31, groupName: "D", homeSlot: "D1", awaySlot: "D3" },
    { number: 32, groupName: "D", homeSlot: "D4", awaySlot: "D2" },
    { number: 55, groupName: "D", homeSlot: "D4", awaySlot: "D1" },
    { number: 56, groupName: "D", homeSlot: "D2", awaySlot: "D3" },
  ];

  for (const match of groupMatches) {
    await prisma.match.create({
      data: {
        number: match.number,
        phase: MatchPhase.GROUP,
        groupName: match.groupName,
        homeSlot: match.homeSlot,
        awaySlot: match.awaySlot,
        homeTeamId: teamsBySlot.get(match.homeSlot),
        awayTeamId: teamsBySlot.get(match.awaySlot),
      },
    });
  }

  console.log("Seed finalizado!");
  console.log("Login admin: admin@bolao.com");
  console.log("Senha admin: admin123");
  console.log("Código da liga: COPA26");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
