import * as React from 'react';
import { useState } from 'react';
import { makeStyles, AppBar, Tabs, Tab, Button, Toolbar } from '@material-ui/core';
import ExcelSheet from './tabs/excel/ExcelSheet';
import Tree from './tabs/tree/Tree';
import Scheduler from './tabs/sched/Scheduler';
import { useAuth0 } from "@auth0/auth0-react";
import { generateAPIState, loadApiData, } from './resources/ApiCall';
import { isEmpty } from 'lodash';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  content: {
    flexGrow: 1
  },
  fillSpace: {
    flexGrow: 1
  },
  logoutButton: {
    margin: theme.spacing(1)
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

export default function RouterTabExample() {
  const classes = useStyles();

  const [selectedTab, setSelectedTab] = useState(0);
  const handleCallToRouter = (event: any, newVal: any) => {
    setSelectedTab(newVal);
  }

  const { getAccessTokenSilently } = useAuth0();
  const user = generateAPIState();
  if (!user.requested) {
    user.setRequested(true);
    loadApiData(() => {
      return [window.__BACKEND_IP__ + "/userName", {}];
    }, user.setLoading, user.setData,
      function handleError(err: any) {
        console.log("Username request failed with error", err);
      }, getAccessTokenSilently);
  }

  let userName = "Welcome!";
  if (!isEmpty(user.data)) {
    userName = "Welcome, " + user.data.data.split(" ")[0] + "!";
  }

  const { logout } = useAuth0();

  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.appBar}>
        <Tabs
          value={selectedTab}
          onChange={handleCallToRouter}
        >
          <Tab label="Tree"></Tab>
          <Tab label="Scheduler"></Tab>
          <Tab label="Excel Sheet"></Tab>
          <div className={classes.fillSpace}></div>
          <h3>{userName}</h3>
          <Button
            className={classes.logoutButton}
            variant="contained"
            color="secondary"
            onClick={() => logout({ returnTo: window.location.origin })}
          >
            Logout
          </Button>
        </Tabs>
      </AppBar>
      <div className={classes.content}>
        {selectedTab == 0 && <Tree />}
        {selectedTab == 1 && <Scheduler />}
        {selectedTab == 2 && <ExcelSheet />}
      </div>
    </div>
  )
}
