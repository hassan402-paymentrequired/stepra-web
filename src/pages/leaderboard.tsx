import { useState } from "react";
import { useNavigate } from "react-router";
import AppLayout from "@/components/layouts/app-layout";
import type { LeaderboardUser } from "@/apis/leaderboard";
import { useLeaderboard } from "@/hooks/queries/useLeaderboard";
import {
    Trophy,
    Medal,
    Award,
    ArrowLeft,
    Loader2,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LeaderboardPeriod = "weekly" | "monthly" | "all_time";
type LeaderboardExamType = "JAMB" | "DLI" | "UNILAG" | "GENERAL" | null;

const examTypeOptions: { label: string; value: LeaderboardExamType }[] = [
    { label: "All Exams", value: null },
    { label: "JAMB", value: "JAMB" },
    { label: "DLI", value: "DLI" },
    { label: "UNILAG", value: "UNILAG" },
    { label: "GENERAL", value: "GENERAL" },
];

const Leaderboard = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<LeaderboardPeriod>("all_time");
    const [examType, setExamType] = useState<LeaderboardExamType>(null);

    const { data, isLoading: loading } = useLeaderboard(filter, examType);
    const leaderboard = data?.leaderboard ?? [];
    const currentUserRank = data?.currentUser ?? null;

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
        if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />;
        return null;
    };

    const getRankBg = (rank: number, isCurrentUser: boolean) => {
        if (rank && isCurrentUser) return "bg-primary/5 border-primary/20 shadow-sm";
        return "bg-card border-border hover:border-primary/30";
    };

    return (
        <AppLayout>
            <div className="w-full max-w-4xl mx-auto space-y-6 pb-10">
                <div className="flex flex-col gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit -ml-2 h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate("/dashboard")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Back to Home
                    </Button>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                                <Trophy className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
                                <p className="text-sm text-muted-foreground">
                                    Recognizing our top performers
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="border-border/50">
                    <CardHeader className="pb-3 pt-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Performance Ranking
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Filter by time period and exam type
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Tabs
                            value={filter}
                            onValueChange={(v) => setFilter(v as LeaderboardPeriod)}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                                <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
                                <TabsTrigger value="all_time" className="text-xs">All Time</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex flex-wrap gap-2">
                            {examTypeOptions.map((option) => (
                                <button
                                    key={option.label}
                                    type="button"
                                    onClick={() => setExamType(option.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                        examType === option.value
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {currentUserRank && !loading && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                            Your Position
                        </h3>
                        <LeaderboardItem performer={currentUserRank} isCurrentUser={true} getRankIcon={getRankIcon} getRankBg={getRankBg} />
                    </div>
                )}

                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                        Overall Rankings
                    </h3>
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-card border border-border/50 rounded-xl border-dashed">
                            <Loader2 className="h-8 w-8 animate-spin mb-3 opacity-20" />
                            <p className="text-sm">Loading performers...</p>
                        </div>
                    ) : leaderboard.length > 0 ? (
                        <div className="grid gap-2.5">
                            {leaderboard.map((performer) => (
                                <LeaderboardItem
                                    key={performer.user.id}
                                    performer={performer}
                                    isCurrentUser={performer.user.id === currentUserRank?.user?.id}
                                    getRankIcon={getRankIcon}
                                    getRankBg={getRankBg}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center rounded-xl bg-muted/20 border border-dashed border-border p-8">
                            <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                            <p className="text-sm font-medium text-muted-foreground">
                                No rankings for this period yet
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                Start practicing to see your name here!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

const LeaderboardItem = ({
    performer,
    isCurrentUser,
    getRankIcon,
    getRankBg
}: {
    performer: LeaderboardUser;
    isCurrentUser: boolean;
    getRankIcon: (rank: number) => React.ReactNode;
    getRankBg: (rank: number, isCurrentUser: boolean) => string;
}) => (
    <div
        className={`flex items-center justify-between p-3 md:p-4 rounded-xl border ${getRankBg(performer.rank, isCurrentUser)} transition-all duration-200`}
    >
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-background border border-border shadow-sm flex-shrink-0">
                {getRankIcon(performer.rank) || (
                    <span className="text-sm font-bold text-muted-foreground">
                        {performer.rank}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm md:text-base truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                        {performer.user.name}
                    </p>
                    {isCurrentUser && (
                        <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">
                            You
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-primary/60" />
                        <span className="text-xs font-semibold text-muted-foreground">
                            Score: {performer.statistics.total_score.toLocaleString()}
                        </span>
                    </div>
                    {performer.statistics.accuracy > 0 && (
                        <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-primary/60" />
                            <span className="text-xs font-semibold text-muted-foreground">
                                {performer.statistics.accuracy.toFixed(1)}% acc
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            {performer.rank <= 3 && (
                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                </div>
            )}
        </div>
    </div>
);

export default Leaderboard;
