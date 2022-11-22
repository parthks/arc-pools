import clc from "cli-color";
import figlet from "figlet";

import { ArgumentsInterface } from "../interfaces";
import CommandInterface from "../interfaces/command";
import { APP_TITLE, CLI_ARGS } from "../config";

const command: CommandInterface = {
    name: CLI_ARGS.commands.help,
    execute: async (args: ArgumentsInterface): Promise<void> => {
        console.log(clc.magenta(figlet.textSync(APP_TITLE)));
        console.log(args);
    }
}

export default command;