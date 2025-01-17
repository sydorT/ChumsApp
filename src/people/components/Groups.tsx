import React from "react";
import { DisplayBox, ApiHelper, UniqueIdHelper, Loading } from "."
import { Link } from "react-router-dom";
import { Icon, Table, TableBody, TableRow, TableCell } from "@mui/material";

interface Props { personId: string }

export const Groups: React.FC<Props> = (props) => {
  const [groupMembers, setGroupMembers] = React.useState(null);

  React.useEffect(() => {
    if (!UniqueIdHelper.isMissing(props.personId)) ApiHelper.get("/groupmembers?personId=" + props.personId, "MembershipApi").then(data => setGroupMembers(data))
  }, [props.personId]);

  const getRecords = () => {
    if (!groupMembers) return <Loading size="sm" />
    else if (groupMembers.length === 0) return (<p>Not part of any group yet.</p>)
    else {
      const items = [];
      for (let i = 0; i < groupMembers.length; i++) {
        let gm = groupMembers[i];
        items.push(<TableRow key={gm.id}><TableCell><Icon>group</Icon> <Link to={"/groups/" + gm.groupId}>{gm.group.name}</Link></TableCell></TableRow>);
      }
      return (<Table size="small"><TableBody>{items}</TableBody></Table>)
    }
  }

  return <DisplayBox headerIcon="group" headerText="Groups">{getRecords()}</DisplayBox>
}
