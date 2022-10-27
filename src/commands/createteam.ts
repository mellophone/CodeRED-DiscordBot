import { SlashCommandBuilder } from "@discordjs/builders";
import DiscordService from "../utils/DiscordService";
import { Command } from "../interfaces/Command";

export const createteam: Command = {
  data: new SlashCommandBuilder()
    .setName("createteam")
    .setDescription("Start your new hackathon team!")
    .addStringOption((option) =>
      option
        .setName("team-name")
        .setDescription("Your team's name")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("color-hex")
        .setDescription("Your team's color in hexadecimal. Ex: F2086F")
        .setRequired(false)
    ),
  execute: async (interaction) => {
    const { user } = interaction;
    const guild = interaction.guild;
    if (!guild) return;

    const member = await DiscordService.getMember(guild, user);
    if (!member) return;

    // Cancel if you already have a team
    const currentTeam = await DiscordService.getTeam(member);
    if (currentTeam != undefined) {
      await interaction.reply(DiscordService.alreadyInTeamMessage(currentTeam));
      return;
    }

    const teamName = interaction.options.getString("team-name", true);

    // Cancel if team name is bad
    if (!(await DiscordService.teamNameAllowed(teamName))) {
      await interaction.reply(DiscordService.badTeamNameMessage(teamName));
      return;
    }

    const currentRoles = await DiscordService.getGuildRoles(guild);
    if (!currentRoles) return;

    // Cancel if team name is taken
    if (await DiscordService.teamNameTaken(teamName, currentRoles)) {
      await interaction.reply(DiscordService.takenTeamNameMessage(teamName));
      return;
    }

    const color = DiscordService.getColor(
      interaction.options.getString("color-hex", false)
    );

    // Create new team
    const newTeam = await guild.roles.create({
      name: teamName,
      color,
    });

    // Add to team
    await DiscordService.addToTeam(member, newTeam);
    await interaction.reply(await DiscordService.newTeamMessage(newTeam));
  },
};
