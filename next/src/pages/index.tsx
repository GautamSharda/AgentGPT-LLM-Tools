import React, { useEffect, useRef } from "react";
import { MESSAGE_TYPE_TASK, TASK_STATUS_STARTED } from "../types/agentTypes";
import { v1 } from "uuid";
import { useTranslation } from "next-i18next";
import { type GetStaticProps, type NextPage } from "next";
import Badge from "../components/Badge";
import DefaultLayout from "../layout/default";
import ChatWindow from "../components/ChatWindow";
import Drawer from "../components/Drawer";
import Input from "../components/Input";
import Button from "../components/Button";
import { FaPlay, FaRobot, FaStar } from "react-icons/fa";
import PopIn from "../components/motions/popin";
import { VscLoading } from "react-icons/vsc";
import AutonomousAgent from "../components/AutonomousAgent";
import Expand from "../components/motions/expand";
import HelpDialog from "../components/HelpDialog";
import { SettingsDialog } from "../components/SettingsDialog";
import { TaskWindow } from "../components/TaskWindow";
import { useAuth } from "../hooks/useAuth";
import type { AgentPlaybackControl, Message } from "../types/agentTypes";
import { AGENT_PLAY, isTask } from "../types/agentTypes";
import { useAgent } from "../hooks/useAgent";
import { isEmptyOrBlank } from "../utils/whitespace";
import { resetAllMessageSlices, useAgentStore, useMessageStore } from "../stores";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSettings } from "../hooks/useSettings";
import { findLanguage, languages } from "../utils/languages";
import nextI18NextConfig from "../../next-i18next.config.js";
import { SorryDialog } from "../components/SorryDialog";
import { SignInDialog } from "../components/SignInDialog";
import { env } from "../env/client.mjs";
import { get } from "lodash";
// import { gapi } from 'gapi-script';


const Home: NextPage = () => {
  const { i18n } = useTranslation();
  // Zustand states with state dependencies
  const addMessage = useMessageStore.use.addMessage();
  const deleteTask = useMessageStore.use.deleteTask();
  const messages = useMessageStore.use.messages();
  //@ts-ignore
  const getTasks = useMessageStore.use.getTasks();
  const updateTaskStatus = useMessageStore.use.updateTaskStatus();

  const setAgent = useAgentStore.use.setAgent();
  const isAgentStopped = useAgentStore.use.isAgentStopped();
  const isAgentPaused = useAgentStore.use.isAgentPaused();
  const updateIsAgentPaused = useAgentStore.use.updateIsAgentPaused();
  const updateIsAgentStopped = useAgentStore.use.updateIsAgentStopped();
  const agentMode = useAgentStore.use.agentMode();
  const agent = useAgentStore.use.agent();

  const { session, status } = useAuth();
  const [nameInput, setNameInput] = React.useState<string>("");
  const [goalInput, setGoalInput] = React.useState<string>("");
  const [mobileVisibleWindow, setMobileVisibleWindow] = React.useState<"Chat" | "Tasks">("Chat");
  const settingsModel = useSettings();

  const [showHelpDialog, setShowHelpDialog] = React.useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = React.useState(false);
  const [showSorryDialog, setShowSorryDialog] = React.useState(false);
  const [showSignInDialog, setShowSignInDialog] = React.useState(false);
  const [hasSaved, setHasSaved] = React.useState(false);
  const agentUtils = useAgent();
  const [flag, setFlag] = React.useState(true);
  const [token, setToken] = React.useState<string>("")



  const OAuthCheck = () => {
    var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    // Parameters to pass to OAuth 2.0 endpoint.
    var params = {
      'client_id': '406198750695-i6p3k9r380io0tlre38j8jsvv2o4vmk7.apps.googleusercontent.com',
      'redirect_uri': 'http://localhost:3000',
      'response_type': 'token',
      'scope': 'https://www.googleapis.com/auth/blogger',
      'include_granted_scopes': 'true',
      'state': 'pass-through value'
    };

    // Create the OAuth URL
    var url = oauth2Endpoint + '?' + Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');

    // Open the new window
    const newWin = window.open(url, "_blank");

    // Poll the new window's location for the access token
    var tokenCheckInterval = setInterval(() => {
      try {
        console.log('checking location');
        //@ts-ignore
        if (newWin.location.href.includes('access_token')) {
          clearInterval(tokenCheckInterval);
          //@ts-ignore
          const newWinURI = newWin.location.href;
          const token = newWinURI.substring(newWinURI.indexOf("access_token=") + 13, newWinURI.indexOf("&token_type"));
          console.log(token);
          console.log('done');
          //@ts-ignore
          newWin.close();
          addMessage({
            taskId: v1().toString(),
            value: "The JWT OAuth Token to call the blogger API is: " + token,
            status: TASK_STATUS_STARTED,
            type: MESSAGE_TYPE_TASK,
          });

        }
      } catch (e) {
        console.log('bad location');
      }
    }, 1000);
  }

  // const addTokenToMessage = (token: string) => {
  // console.log('clicked');
  // var tasks: any[] = getTasks();
  // console.log(tasks)
  // console.log(tasks.length)
  // if (tasks === undefined) {
  //   tasks = [];
  // }
  // if (tasks.length === 0) {
  //   console.log('first one');
  //   addMessage({
  //     taskId: v1().toString(),
  //     value: "The JWT OAuth Token to call the blogger API is: " + token,
  //     status: TASK_STATUS_STARTED,
  //     type: MESSAGE_TYPE_TASK,
  //   });
  // } else {
  //   console.log('here123');
  //   const lastTask = tasks[tasks.length - 1];
  //   console.log(lastTask);
  //   deleteTask(lastTask.taskId);
  //   addMessage({
  //     taskId: v1().toString(),
  //     value: lastTask.value + "The JWT OAuth Token to call the blogger API is: " + token,
  //     status: TASK_STATUS_STARTED,
  //     type: MESSAGE_TYPE_TASK,
  //   });
  // }
  // }


  // const updateWithOAuth = (jwtToken: string) => {
  //   addMessage({
  //     taskId: v1().toString(),
  //     value: jwtToken,
  //     status: TASK_STATUS_STARTED,
  //     type: MESSAGE_TYPE_TASK,
  //   });
  // }

  messages.forEach((message) => {
    console.log(message);
    if (message.value.toUpperCase().includes("LLM-TOOLS-OAUTH-BLOGGER") && flag) {
      console.log("HITTT");
      setFlag(false);
      OAuthCheck();
    }
  });

  useEffect(() => {
    const key = "agentgpt-modal-opened-v0.2";
    const savedModalData = localStorage.getItem(key);

    setTimeout(() => {
      if (savedModalData == null) {
        setShowHelpDialog(true);
      }
    }, 1800);

    localStorage.setItem(key, JSON.stringify(true));
  }, []);

  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameInputRef?.current?.focus();
  }, []);

  useEffect(() => {
    updateIsAgentStopped();
  }, [agent, updateIsAgentStopped]);

  const setAgentRun = (newName: string, newGoal: string) => {
    if (agent != null) {
      return;
    }

    setNameInput(newName);
    setGoalInput(newGoal);
    handleNewGoal(newName, newGoal);
  };

  const handleAddMessage = (message: Message) => {
    if (isTask(message)) {
      updateTaskStatus(message);
    }

    addMessage(message);
  };

  const handlePause = (opts: { agentPlaybackControl?: AgentPlaybackControl }) => {
    if (opts.agentPlaybackControl !== undefined) {
      updateIsAgentPaused(opts.agentPlaybackControl);
    }
  };

  const disableDeployAgent =
    agent != null || isEmptyOrBlank(nameInput) || isEmptyOrBlank(goalInput);

  const handleNewGoal = (name: string, goal: string) => {
    if (name.trim() === "" || goal.trim() === "") {
      return;
    }

    // Do not force login locally for people that don't have auth setup
    if (session === null && env.NEXT_PUBLIC_FORCE_AUTH) {
      setShowSignInDialog(true);
      return;
    }

    const newAgent = new AutonomousAgent(
      name.trim(),
      goal.trim(),
      findLanguage(i18n.language).name,
      handleAddMessage,
      handlePause,
      () => setAgent(null),
      settingsModel.settings,
      agentMode,
      session ?? undefined
    );
    setAgent(newAgent);
    setHasSaved(false);
    resetAllMessageSlices();
    newAgent?.run().then(console.log).catch(console.error);
  };

  const handleContinue = () => {
    if (!agent) {
      return;
    }

    agent.updatePlayBackControl(AGENT_PLAY);
    updateIsAgentPaused(agent.playbackControl);
    agent.updateIsRunning(true);
    agent.run().then(console.log).catch(console.error);
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement> | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    // Only Enter is pressed, execute the function
    if (e.key === "Enter" && !disableDeployAgent && !e.shiftKey) {
      if (isAgentPaused) {
        handleContinue();
      }
      handleNewGoal(nameInput, goalInput);
    }
  };

  const handleStopAgent = () => {
    agent?.stopAgent();
    updateIsAgentStopped();
  };

  const handleVisibleWindowClick = (visibleWindow: "Chat" | "Tasks") => {
    // This controls whether the ChatWindow or TaskWindow is visible on mobile
    setMobileVisibleWindow(visibleWindow);
  };

  const shouldShowSave =
    status === "authenticated" && isAgentStopped && messages.length && !hasSaved;

  const firstButton =
    isAgentPaused && !isAgentStopped ? (
      <Button ping disabled={!isAgentPaused} onClick={handleContinue}>
        <FaPlay size={20} />
        <span className="ml-2">{i18n.t("CONTINUE", { ns: "common" })}</span>
      </Button>
    ) : (
      <Button
        ping={!disableDeployAgent}
        disabled={disableDeployAgent}
        onClick={() => handleNewGoal(nameInput, goalInput)}
      >
        {agent == null ? (
          i18n.t("BUTTON_DEPLOY_AGENT", { ns: "indexPage" })
        ) : (
          <>
            <VscLoading className="animate-spin" size={20} />
            <span className="ml-2">{i18n.t("RUNNING", { ns: "common" })}</span>
          </>
        )}
      </Button>
    );

  return (
    <DefaultLayout>
      <HelpDialog show={showHelpDialog} close={() => setShowHelpDialog(false)} />
      <SettingsDialog
        customSettings={settingsModel}
        show={showSettingsDialog}
        close={() => setShowSettingsDialog(false)}
      />
      <SorryDialog show={showSorryDialog} close={() => setShowSorryDialog(false)} />
      <SignInDialog show={showSignInDialog} close={() => setShowSignInDialog(false)} />
      <main className="flex min-h-screen flex-row">
        <Drawer
          showHelp={() => setShowHelpDialog(true)}
          showSettings={() => setShowSettingsDialog(true)}
        />
        <div
          id="content"
          className="z-10 flex min-h-screen w-full items-center justify-center p-2 sm:px-4 md:px-10"
        >
          <div
            id="layout"
            className="flex h-full w-full max-w-screen-xl flex-col items-center justify-between gap-1 py-2 sm:gap-3 sm:py-5 md:justify-center"
          >
            <div id="title" className="relative flex flex-col items-center font-mono">
              <div className="flex flex-row items-start shadow-2xl">
                <span className="text-4xl font-bold text-[#C0C0C0] xs:text-5xl sm:text-6xl">
                  Agent
                </span>
                <span className="text-4xl font-bold text-white xs:text-5xl sm:text-6xl">GPT</span>
                <PopIn delay={0.5}>
                  <Badge>
                    {`${i18n?.t("BETA", {
                      ns: "indexPage",
                    })}`}{" "}
                    🚀
                  </Badge>
                </PopIn>
              </div>
              <div className="mt-1 text-center font-mono text-[0.7em] font-bold text-white">
                <p>
                  {i18n.t("HEADING_DESCRIPTION", {
                    ns: "indexPage",
                  })}
                </p>
              </div>
            </div>

            <div>
              <Button
                className="rounded-r-none py-0 text-sm sm:py-[0.25em] xl:hidden"
                disabled={mobileVisibleWindow == "Chat"}
                onClick={() => handleVisibleWindowClick("Chat")}
              >
                Chat
              </Button>
              <Button
                className="rounded-l-none py-0 text-sm sm:py-[0.25em] xl:hidden"
                disabled={mobileVisibleWindow == "Tasks"}
                onClick={() => handleVisibleWindowClick("Tasks")}
              >
                Tasks
              </Button>
            </div>
            <Expand className="flex w-full flex-row">
              <ChatWindow
                messages={messages}
                title="AgentGPT"
                onSave={
                  shouldShowSave
                    ? (format) => {
                      setHasSaved(true);
                      agentUtils.saveAgent({
                        goal: goalInput.trim(),
                        name: nameInput.trim(),
                        tasks: messages,
                      });
                    }
                    : undefined
                }
                scrollToBottom
                displaySettings
                openSorryDialog={() => setShowSorryDialog(true)}
                setAgentRun={setAgentRun}
                visibleOnMobile={mobileVisibleWindow === "Chat"}
              />
              <TaskWindow visibleOnMobile={mobileVisibleWindow === "Tasks"} />
            </Expand>

            <div className="flex w-full flex-col gap-2 md:m-4 ">
              <Expand delay={1.2}>
                <Input
                  inputRef={nameInputRef}
                  left={
                    <>
                      <FaRobot />
                      <span className="ml-2">{`${i18n?.t("AGENT_NAME", {
                        ns: "indexPage",
                      })}`}</span>
                    </>
                  }
                  value={nameInput}
                  disabled={agent != null}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e)}
                  placeholder="AgentGPT"
                  type="text"
                />
              </Expand>
              <Expand delay={1.3}>
                <Input
                  left={
                    <>
                      <FaStar />
                      <span className="ml-2">{`${i18n?.t("LABEL_AGENT_GOAL", {
                        ns: "indexPage",
                      })}`}</span>
                    </>
                  }
                  disabled={agent != null}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e)}
                  placeholder={`${i18n?.t("PLACEHOLDER_AGENT_GOAL", {
                    ns: "indexPage",
                  })}`}
                  type="textarea"
                />
              </Expand>
            </div>
            <Expand delay={1.4} className="flex gap-2">
              {firstButton}
              <Button
                disabled={agent === null}
                onClick={handleStopAgent}
                enabledClassName={"bg-red-600 hover:bg-red-400"}
              >
                {!isAgentStopped && agent === null ? (
                  <>
                    <VscLoading className="animate-spin" size={20} />
                    <span className="ml-2">{`${i18n?.t("BUTTON_STOPPING", {
                      ns: "indexPage",
                    })}`}</span>
                  </>
                ) : (
                  `${i18n?.t("BUTTON_STOP_AGENT", "BUTTON_STOP_AGENT", {
                    ns: "indexPage",
                  })}`
                )}
              </Button>
            </Expand>
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  const supportedLocales = languages.map((language) => language.code);
  const chosenLocale = supportedLocales.includes(locale) ? locale : "en";

  return {
    props: {
      ...(await serverSideTranslations(chosenLocale, nextI18NextConfig.ns)),
    },
  };
};
