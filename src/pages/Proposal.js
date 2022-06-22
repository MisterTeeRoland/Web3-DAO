import React, { useState, useEffect } from "react";
import "./pages.css";
import { Tag, Widget, Blockie, Tooltip, Icon, Form, Table } from "web3uikit";
import { Link } from "react-router-dom";
import { useLocation } from "react-router";
import { useMoralis } from "react-moralis";
import { useWeb3ExecuteFunction } from "react-moralis";

const Proposal = () => {
    const { state: proposalDetails } = useLocation();
    const { Moralis, isInitialized } = useMoralis();
    const [latestVote, setLatestVote] = useState(null);
    const [percUp, setPercUp] = useState(0);
    const [percDown, setPercDown] = useState(0);
    const [votes, setVotes] = useState([]);
    const [sub, setSub] = useState(false);
    const contractProcessor = useWeb3ExecuteFunction();

    useEffect(() => {
        if (isInitialized) {
            async function getVotes() {
                const Votes = Moralis.Object.extend("Votes");
                const query = new Moralis.Query(Votes);
                query.equalTo("proposal", proposalDetails.id);
                query.descending("createdAt");
                const result = await query.find();

                if (result.length > 0) {
                    setLatestVote(result[0].attributes);
                    setPercDown(
                        (
                            (Number(result[0].attributes.votesDown) /
                                (Number(result[0].attributes.votesDown) +
                                    Number(result[0].attributes.votesUp))) *
                            100
                        ).toFixed(0)
                    );
                    setPercUp(
                        (
                            (Number(result[0].attributes.votesUp) /
                                (Number(result[0].attributes.votesDown) +
                                    Number(result[0].attributes.votesUp))) *
                            100
                        ).toFixed(0)
                    );
                }

                const votesDirection = result.map((e) => [
                    e.attributes.voter,
                    <Icon
                        fill={e.attributes.votedFor ? "#2cc40a" : "#d93d3d"}
                        size={24}
                        svg={
                            e.attributes.votedFor
                                ? "checkmark"
                                : "arrowCircleDown"
                        }
                    />,
                ]);

                setVotes(votesDirection);
            }

            getVotes();
        }
    }, [isInitialized]);

    async function castVote(upDown) {
        let options = {
            contractAddress: "0x305B7A9a34B4bc5Da880af8fAF5D12c77d5b174C",
            functionName: "voteOnProposal",
            abi: [
                {
                    inputs: [
                        {
                            internalType: "uint256",
                            name: "_id",
                            type: "uint256",
                        },
                        {
                            internalType: "bool",
                            name: "_vote",
                            type: "bool",
                        },
                    ],
                    name: "voteOnProposal",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function",
                },
            ],
            params: {
                _id: proposalDetails.id,
                _vote: upDown,
            },
        };

        await contractProcessor.fetch({
            params: options,
            onSuccess: () => {
                console.log("Vote Cast Succesfully");
                setSub(false);
            },
            onError: (error) => {
                alert(error?.data?.message ?? error.message);
                setSub(false);
            },
        });
    }

    return (
        <>
            <div className="contentProposal">
                <div className="proposal">
                    <Link to="/">
                        <div className="backHome">
                            <Icon fill="#fff" svg="chevronLeft" size={20} />
                            Overview
                        </div>
                    </Link>
                    <div>{proposalDetails.description}</div>
                    <div className="proposalOverview">
                        <Tag
                            color={proposalDetails.color}
                            text={proposalDetails.text}
                        />
                        <div className="proposer">
                            <span>Proposed By </span>
                            <Tooltip content={proposalDetails.proposer}>
                                <Blockie seed={proposalDetails.proposer} />
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {latestVote && (
                    <div className="widgets">
                        <Widget info={latestVote.votesUp} title="Votes For">
                            <div className="extraWidgetInfo">
                                <div className="extraTitle">{percUp}%</div>
                                <div className="progress">
                                    <div
                                        className="progressPercentage"
                                        style={{ width: `${percUp}%` }}
                                    ></div>
                                </div>
                            </div>
                        </Widget>
                        <Widget
                            info={latestVote.votesDown}
                            title="Votes Against"
                        >
                            <div className="extraWidgetInfo">
                                <div className="extraTitle">{percDown}%</div>
                                <div className="progress">
                                    <div
                                        className="progressPercentage"
                                        style={{ width: `${percDown}%` }}
                                    ></div>
                                </div>
                            </div>
                        </Widget>
                    </div>
                )}

                <div className="votesDiv">
                    <Table
                        style={{ width: "60% " }}
                        columnsConfig="90% 10%"
                        data={votes}
                        header={[<span>Address</span>, <span>Vote</span>]}
                        pageSize={5}
                    />

                    <Form
                        isDisabled={proposalDetails.text !== "Ongoing"}
                        style={{
                            width: "35%",
                            height: "250px",
                            border: "1px solid rgba(6, 158, 252, 0.2)",
                        }}
                        buttonConfig={{
                            isLoading: sub,
                            loadingText: "Casting Vote",
                            text: "Vote",
                            theme: "secondary",
                        }}
                        data={[
                            {
                                inputWidth: "100%",
                                name: "Cast Vote",
                                options: ["For", "Against"],
                                type: "radios",
                                validation: {
                                    required: true,
                                },
                            },
                        ]}
                        onSubmit={(e) => {
                            setSub(true);
                            if (e.data[0].inputResult[0] === "For") {
                                castVote(true);
                            } else {
                                castVote(false);
                            }
                        }}
                        title="Cast Vote"
                    />
                </div>
            </div>
            <div className="voting"></div>
        </>
    );
};

export default Proposal;
