import Header from "@/components/compare/Header";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllModelStats } from "@/lib/models";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Medal, Trophy } from "lucide-react";
import { useState } from "react";

type SortField = "elo" | "wins" | "losses" | "winRate";
type SortDirection = "asc" | "desc";

const Leaderboard = () => {
	const [sortField, setSortField] = useState<SortField>("elo");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

	const {
		data: modelStats,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["model-stats"],
		queryFn: getAllModelStats,
	});

	const handleSort = (field: SortField) => {
		if (field === sortField) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("desc");
		}
	};

	const sortedModels = modelStats
		? [...modelStats].sort((a, b) => {
				const multiplier = sortDirection === "asc" ? 1 : -1;
				return (a[sortField] - b[sortField]) * multiplier;
			})
		: [];

	const getTopModels = (field: SortField, count = 3) => {
		if (!modelStats) return [];
		return [...modelStats].sort((a, b) => b[field] - a[field]).slice(0, count);
	};

	const topEloModels = getTopModels("elo");
	const topWinRateModels = getTopModels("winRate");

	const getSortIcon = (field: SortField) => {
		if (field !== sortField) return null;
		return sortDirection === "asc" ? (
			<ArrowUp className="h-4 w-4" />
		) : (
			<ArrowDown className="h-4 w-4" />
		);
	};

	if (isLoading) {
		return (
			<div className="container mx-auto py-10">
				<h1 className="text-3xl font-bold mb-6">Model Leaderboard</h1>
				<p>Loading model statistics...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto py-10">
				<h1 className="text-3xl font-bold mb-6">Model Leaderboard</h1>
				<p className="text-red-500">
					Error loading model statistics: {(error as Error).message}
				</p>
			</div>
		);
	}

	return (
		<div>
			<Header />
			<div className="container mx-auto py-10">
				<h1 className="text-3xl font-bold mb-6">Model Leaderboard</h1>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Trophy className="h-5 w-5 text-yellow-500" />
								Top Models by Elo
							</CardTitle>
							<CardDescription>
								Models with the highest Elo ratings
							</CardDescription>
						</CardHeader>
						<CardContent>
							{topEloModels.map((model, index) => (
								<div
									key={model.modelName}
									className="flex items-center justify-between mb-4 last:mb-0"
								>
									<div className="flex items-center gap-3">
										<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
											{index === 0 ? (
												<Medal className="h-4 w-4 text-yellow-500" />
											) : index === 1 ? (
												<Medal className="h-4 w-4 text-gray-400" />
											) : (
												<Medal className="h-4 w-4 text-amber-700" />
											)}
										</div>
										<div>
											<p className="font-medium">{model.modelName}</p>
											<p className="text-sm text-muted-foreground">
												{model.wins} wins, {model.losses} losses
											</p>
										</div>
									</div>
									<div className="text-xl font-bold">{model.elo}</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Trophy className="h-5 w-5 text-green-500" />
								Top Win Rates
							</CardTitle>
							<CardDescription>
								Models with the highest win percentages
							</CardDescription>
						</CardHeader>
						<CardContent>
							{topWinRateModels.map((model, index) => (
								<div
									key={model.modelName}
									className="flex items-center justify-between mb-4 last:mb-0"
								>
									<div className="flex items-center gap-3">
										<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
											{index === 0 ? (
												<Medal className="h-4 w-4 text-yellow-500" />
											) : index === 1 ? (
												<Medal className="h-4 w-4 text-gray-400" />
											) : (
												<Medal className="h-4 w-4 text-amber-700" />
											)}
										</div>
										<div>
											<p className="font-medium">{model.modelName}</p>
											<p className="text-sm text-muted-foreground">
												{model.wins} wins, {model.losses} losses
											</p>
										</div>
									</div>
									<div className="text-xl font-bold">{model.winRate}%</div>
								</div>
							))}
						</CardContent>
					</Card>
				</div>

				<Tabs defaultValue="all">
					<TabsList className="mb-6">
						<TabsTrigger value="all">All Models</TabsTrigger>
						<TabsTrigger value="top10">Top 10</TabsTrigger>
					</TabsList>

					<TabsContent value="all">
						<Card>
							<CardHeader>
								<CardTitle>Complete Model Rankings</CardTitle>
								<CardDescription>
									All models ranked by Elo, wins, losses, and win rate
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Rank</TableHead>
											<TableHead>Model</TableHead>
											<TableHead
												className="cursor-pointer"
												onClick={() => handleSort("elo")}
											>
												<div className="flex items-center gap-1">
													Elo {getSortIcon("elo")}
												</div>
											</TableHead>
											<TableHead
												className="cursor-pointer"
												onClick={() => handleSort("wins")}
											>
												<div className="flex items-center gap-1">
													Wins {getSortIcon("wins")}
												</div>
											</TableHead>
											<TableHead
												className="cursor-pointer"
												onClick={() => handleSort("losses")}
											>
												<div className="flex items-center gap-1">
													Losses {getSortIcon("losses")}
												</div>
											</TableHead>
											<TableHead
												className="cursor-pointer"
												onClick={() => handleSort("winRate")}
											>
												<div className="flex items-center gap-1">
													Win Rate {getSortIcon("winRate")}
												</div>
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{sortedModels.map((model, index) => (
											<TableRow key={model.modelName}>
												<TableCell>{index + 1}</TableCell>
												<TableCell className="font-medium">
													{model.modelName}
												</TableCell>
												<TableCell>{model.elo}</TableCell>
												<TableCell>{model.wins}</TableCell>
												<TableCell>{model.losses}</TableCell>
												<TableCell>{model.winRate}%</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="top10">
						<Card>
							<CardHeader>
								<CardTitle>Top 10 Models</CardTitle>
								<CardDescription>
									The 10 highest-ranked models based on current sorting
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Rank</TableHead>
											<TableHead>Model</TableHead>
											<TableHead
												className="cursor-pointer"
												onClick={() => handleSort("elo")}
											>
												<div className="flex items-center gap-1">
													Elo {getSortIcon("elo")}
												</div>
											</TableHead>
											<TableHead
												className="cursor-pointer"
												onClick={() => handleSort("wins")}
											>
												<div className="flex items-center gap-1">
													Wins {getSortIcon("wins")}
												</div>
											</TableHead>
											<TableHead
												className="cursor-pointer"
												onClick={() => handleSort("losses")}
											>
												<div className="flex items-center gap-1">
													Losses {getSortIcon("losses")}
												</div>
											</TableHead>
											<TableHead
												className="cursor-pointer"
												onClick={() => handleSort("winRate")}
											>
												<div className="flex items-center gap-1">
													Win Rate {getSortIcon("winRate")}
												</div>
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{sortedModels.slice(0, 10).map((model, index) => (
											<TableRow key={model.modelName}>
												<TableCell>{index + 1}</TableCell>
												<TableCell className="font-medium">
													{model.modelName}
												</TableCell>
												<TableCell>{model.elo}</TableCell>
												<TableCell>{model.wins}</TableCell>
												<TableCell>{model.losses}</TableCell>
												<TableCell>{model.winRate}%</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
};

export default Leaderboard;
