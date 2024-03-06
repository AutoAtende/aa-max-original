import React from "react";
import { Chip, makeStyles } from "@material-ui/core";
import { i18n } from "../../translate/i18n";
import OutlinedDiv from "../OutlinedDiv";

const useStyles = makeStyles(theme => ({
    chip: {
        margin: theme.spacing(0.5),
        cursor: "pointer"
    }
}));

const MessageVariablesPicker = ({ onClick, disabled }) => {
    const classes = useStyles();

    const handleClick = (e, value) => {
        e.preventDefault();
        if (disabled) return;
        onClick(value);
    };

    const msgVars = [
        {
            name: i18n.t("messageVariablesPicker.vars.contactFirstName"),
            value: "{{firstName}}"
        },
        {
            name: i18n.t("messageVariablesPicker.vars.contactName"),
            value: "{{name}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.greeting"),
            value: "{{ms}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.protocolNumber"),
            value: "{{protocol}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.date"),
            value: "{{date}} "
        },
        {
            name: i18n.t("messageVariablesPicker.vars.hour"),
            value: "{{hour}} "
        },
    ];

    return (
        <OutlinedDiv
            margin="dense"
            fullWidth
            label={i18n.t("messageVariablesPicker.label")}
            disabled={disabled}
        >
            {msgVars.map(msgVar => (
                <Chip
                    key={msgVar.value}
                    onMouseDown={e => handleClick(e, msgVar.value)}
                    label={msgVar.name}
                    size="small"
                    className={classes.chip}
                    color="primary"
                />
            ))}
        </OutlinedDiv>
    );
};

export default MessageVariablesPicker;