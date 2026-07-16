import Foundation

enum SleepMetricsRange: String, CaseIterable, Identifiable {
    case thirtyDays = "30D"
    case ninetyDays = "90D"
    case oneYear = "1Y"
    case all = "All"

    var id: String { rawValue }

    var days: Int? {
        switch self {
        case .thirtyDays:
            return 30
        case .ninetyDays:
            return 90
        case .oneYear:
            return 365
        case .all:
            return nil
        }
    }
}

struct SleepNightRecord: Identifiable {
    var id: Date { date }
    let date: Date
    let weekday: Int
    let durationHours: Double
    let bedtimeOffset: Double
    let wakeOffset: Double
    let midpointOffset: Double
}

struct SleepMovingAveragePoint: Identifiable {
    var id: Date { date }
    let date: Date
    let durationHours: Double
    let movingAverageHours: Double?
}

struct SleepConsistencyPoint: Identifiable {
    var id: Date { date }
    let date: Date
    let sleepConsistency: Int?
    let wakeConsistency: Int?
    let scheduleAccuracy: Int?
}

struct SleepDebtPoint: Identifiable {
    var id: Date { date }
    let date: Date
    let cumulativeHours: Double
}

struct SleepWeekdayAverage: Identifiable {
    var id: Int { weekday }
    let weekday: Int
    let dayName: String
    let averageHours: Double
    let nights: Int
}

struct SleepDurationBucket: Identifiable {
    var id: String { label }
    let label: String
    let count: Int
    let share: Double
}

struct SleepTrendPeriod: Identifiable {
    var id: Int { days }
    let days: Int
    let averageDuration: Double?
    let previousAverageDuration: Double?
    let changePercent: Double?
    let sparkline: [Double]
}

struct SleepAlignmentScorePoint: Identifiable {
    var id: Date { date }
    let date: Date
    let dailyScore: Double
    let trendScore: Double
    let durationScore: Double
    let timingScore: Double
    let phaseScore: Double
    let consistencyScore: Double
}

@MainActor
struct SleepMetricsAnalyzer {
    private let calendar = Calendar.current
    private let minimumIncludedComponentScore = 0.01

    let records: [SleepNightRecord]
    let targetDurationHours: Double
    let targetSleepOffset: Double?
    let targetWakeOffset: Double?

    init(
        sessions: [BlockedProfileSession],
        optimalSleepTime: Date?,
        optimalWakeTime: Date?
    ) {
        let canonical = Self.canonicalSessions(from: sessions)
        self.records = canonical.compactMap { session in
            guard
                let endTime = session.endTime,
                let bedtimeOffset = SleepDataUtils.calculateTimeOffset(
                    for: session.startTime,
                    timeZone: session.startTimeZone
                ),
                let wakeOffset = SleepDataUtils.calculateTimeOffset(
                    for: endTime,
                    timeZone: session.endTimeZone
                )
            else {
                return nil
            }

            let durationHours = max(0, session.duration / 3600.0)
            let displayDate =
                SleepDataUtils.normalizedSleepDayDate(for: session)
                ?? session.sleepDate
            let weekday = session.calendarForEndTime.component(.weekday, from: session.sleepDate)
            return SleepNightRecord(
                date: displayDate,
                weekday: weekday,
                durationHours: durationHours,
                bedtimeOffset: bedtimeOffset,
                wakeOffset: wakeOffset,
                midpointOffset: bedtimeOffset + (durationHours / 2.0)
            )
        }

        self.targetDurationHours = Self.goalDurationHours(
            optimalSleepTime: optimalSleepTime,
            optimalWakeTime: optimalWakeTime
        )
        self.targetSleepOffset = SleepDataUtils.calculateTimeOffset(
            for: optimalSleepTime
        )
        self.targetWakeOffset = SleepDataUtils.calculateTimeOffset(
            for: optimalWakeTime
        )
    }

    var firstTrackedDate: Date? {
        records.first.map { calendar.startOfDay(for: $0.date) }
    }

    var dataRangeDays: Int {
        guard let first = firstTrackedDate else { return 0 }
        let today = calendar.startOfDay(for: Date())
        return (calendar.dateComponents([.day], from: first, to: today).day ?? 0) + 1
    }

    func records(in range: SleepMetricsRange, relativeTo referenceDate: Date = Date())
        -> [SleepNightRecord]
    {
        guard let days = range.days else { return records }
        guard
            let startDate = calendar.date(
                byAdding: .day,
                value: -(days - 1),
                to: calendar.startOfDay(for: referenceDate)
            )
        else {
            return records
        }

        guard !records.isEmpty else { return [] }

        var low = 0
        var high = records.count
        while low < high {
            let mid = (low + high) / 2
            if records[mid].date < startDate {
                low = mid + 1
            } else {
                high = mid
            }
        }

        guard low < records.count else { return [] }
        return Array(records[low...])
    }

    func averageDuration(_ records: [SleepNightRecord]) -> Double? {
        average(records.map(\.durationHours))
    }

    func medianDuration(_ records: [SleepNightRecord]) -> Double? {
        let values = records.map(\.durationHours).sorted()
        guard !values.isEmpty else { return nil }
        if values.count.isMultiple(of: 2) {
            let left = values[(values.count / 2) - 1]
            let right = values[values.count / 2]
            return (left + right) / 2.0
        }
        return values[values.count / 2]
    }

    func totalSleepHours(_ records: [SleepNightRecord]) -> Double {
        records.reduce(0.0) { $0 + $1.durationHours }
    }

    func longestNight(_ records: [SleepNightRecord]) -> Double? {
        records.map(\.durationHours).max()
    }

    func shortestNight(_ records: [SleepNightRecord]) -> Double? {
        records
            .map(\.durationHours)
            .filter { $0 > 0 }
            .min()
    }

    func trackingCoverage(
        _ records: [SleepNightRecord],
        in range: SleepMetricsRange
    ) -> Int {
        guard !records.isEmpty else { return 0 }

        let denominator: Double
        if let rangeDays = range.days {
            denominator = Double(max(1, rangeDays))
        } else {
            denominator = Double(max(1, dataRangeDays))
        }

        let ratio = Double(records.count) / denominator
        return Int((min(max(ratio, 0), 1) * 100).rounded())
    }

    func goalHitRate(
        _ records: [SleepNightRecord],
        toleranceHours: Double = 0.75
    ) -> Int {
        guard !records.isEmpty else { return 0 }
        let hits = records.filter {
            abs($0.durationHours - targetDurationHours) <= toleranceHours
        }.count
        return Int((Double(hits) / Double(records.count) * 100).rounded())
    }

    func durationTrendPercent(
        _ records: [SleepNightRecord],
        window: Int = 7
    ) -> Double? {
        guard records.count >= window * 2 else { return nil }
        let current = Array(records.suffix(window))
        let previous = Array(records.dropLast(window).suffix(window))
        guard
            let currentAvg = average(current.map(\.durationHours)),
            let previousAvg = average(previous.map(\.durationHours)),
            previousAvg > 0
        else {
            return nil
        }

        return ((currentAvg - previousAvg) / previousAvg) * 100.0
    }

    func sleepConsistencyScore(_ records: [SleepNightRecord]) -> Int {
        consistencyScore(values: records.map(\.bedtimeOffset))
    }

    func wakeConsistencyScore(_ records: [SleepNightRecord]) -> Int {
        consistencyScore(values: records.map(\.wakeOffset))
    }

    func scheduleAccuracyScore(_ records: [SleepNightRecord]) -> Int {
        scheduleAccuracyScoreInCollection(records)
    }

    func regularityScore(_ records: [SleepNightRecord]) -> Int {
        let bedtime = sleepConsistencyScore(records)
        let wake = wakeConsistencyScore(records)
        return (bedtime + wake) / 2
    }

    func socialJetlagHours(_ records: [SleepNightRecord]) -> Double? {
        guard !records.isEmpty else { return nil }

        let weekends = records.filter { record in
            record.weekday == 1 || record.weekday == 7
        }
        let weekdays = records.filter { record in
            record.weekday >= 2 && record.weekday <= 6
        }

        guard
            let weekendMidpoint = average(weekends.map(\.midpointOffset)),
            let weekdayMidpoint = average(weekdays.map(\.midpointOffset))
        else {
            return nil
        }

        return wrappedHourDifference(weekendMidpoint, weekdayMidpoint)
    }

    func cumulativeDebtHours(_ records: [SleepNightRecord]) -> Double {
        records.reduce(0.0) { partial, record in
            partial + (record.durationHours - targetDurationHours)
        }
    }

    func movingAverageSeries(
        _ records: [SleepNightRecord],
        window: Int = 7
    ) -> [SleepMovingAveragePoint] {
        guard !records.isEmpty else { return [] }

        var result: [SleepMovingAveragePoint] = []
        result.reserveCapacity(records.count)

        var rollingSum = 0.0
        for index in records.indices {
            rollingSum += records[index].durationHours
            if index >= window {
                rollingSum -= records[index - window].durationHours
            }

            let movingAverage: Double? =
                index + 1 >= window ? (rollingSum / Double(window)) : nil

            result.append(
                SleepMovingAveragePoint(
                    date: records[index].date,
                    durationHours: records[index].durationHours,
                    movingAverageHours: movingAverage
                )
            )
        }

        return result
    }

    func rollingConsistencySeries(
        _ records: [SleepNightRecord],
        window: Int = 14
    ) -> [SleepConsistencyPoint] {
        records.indices.map { index in
            guard index + 1 >= window else {
                return SleepConsistencyPoint(
                    date: records[index].date,
                    sleepConsistency: nil,
                    wakeConsistency: nil,
                    scheduleAccuracy: nil
                )
            }

            let startIndex = index - window + 1
            let slice = records[startIndex...index]
            let sleepConsistency = consistencyScore(records: slice, keyPath: \.bedtimeOffset)
            let wakeConsistency = consistencyScore(records: slice, keyPath: \.wakeOffset)
            let scheduleAccuracy = scheduleAccuracyScoreInCollection(slice)

            return SleepConsistencyPoint(
                date: records[index].date,
                sleepConsistency: sleepConsistency,
                wakeConsistency: wakeConsistency,
                scheduleAccuracy: scheduleAccuracy
            )
        }
    }

    func durationTrendsAnalysis() -> [SleepTrendPeriod] {
        let periods = [3, 7, 14, 30, 90]

        let dailyValues = records.map(\.durationHours)
        let rollingValues = movingAverageSeries(records, window: 7).compactMap(\.movingAverageHours)

        return periods.map { p in
            // For periods <= 14 days, show the raw daily values in the sparkline
            // For longer periods, show the 7-day rolling average to smooth out noise
            let sparklineSrc = p <= 14 ? dailyValues : rollingValues
            let sparkline = Array(sparklineSrc.suffix(p))

            // Calculate averages
            let currentPeriodRecords = Array(records.suffix(p))
            let previousPeriodRecords = Array(records.dropLast(p).suffix(p))

            let currentAvg = average(currentPeriodRecords.map(\.durationHours))
            let previousAvg = average(previousPeriodRecords.map(\.durationHours))

            var changePercent: Double? = nil
            if let cAvg = currentAvg, let pAvg = previousAvg, pAvg > 0 {
                changePercent = ((cAvg - pAvg) / pAvg) * 100.0
            }

            return SleepTrendPeriod(
                days: p,
                averageDuration: currentAvg,
                previousAverageDuration: previousAvg,
                changePercent: changePercent,
                sparkline: sparkline
            )
        }
    }

    func cumulativeDebtSeries(_ records: [SleepNightRecord]) -> [SleepDebtPoint] {
        var running = 0.0
        return records.map { record in
            running += (record.durationHours - targetDurationHours)
            return SleepDebtPoint(date: record.date, cumulativeHours: running)
        }
    }

    func sleepAlignmentSeries(
        _ records: [SleepNightRecord],
        consistencyWindow: Int = 14,
        trendAlpha: Double = 0.2,
        maximumScore: Double = 100.0
    ) -> [SleepAlignmentScorePoint] {
        guard !records.isEmpty, targetDurationHours > 0 else { return [] }
        guard let targetSleepOffset else { return [] }

        let targetMidpoint = targetSleepOffset + (targetDurationHours / 2.0)
        let targetWakeOffset = targetSleepOffset + targetDurationHours
        var previousTrendScore: Double?

        return records.indices.map { index in
            let record = records[index]
            let durationScore = durationAlignmentScore(
                actualHours: record.durationHours,
                targetHours: targetDurationHours
            )
            let timingScore = timingAlignmentScore(
                record: record,
                targetSleepOffset: targetSleepOffset,
                targetWakeOffset: targetWakeOffset
            )
            let phaseScore = phaseAlignmentScore(
                actualMidpoint: record.midpointOffset,
                targetMidpoint: targetMidpoint
            )

            let windowStart = max(records.startIndex, index - consistencyWindow + 1)
            let consistencyScore = consistencyAlignmentScore(records[windowStart...index])

            let dailyScore = maximumScore * extrapolatedAlignmentScore([
                (score: durationScore, weight: 0.35),
                (score: timingScore, weight: 0.30),
                (score: phaseScore, weight: 0.20),
                (score: consistencyScore, weight: 0.15),
            ])
            let trendScore =
                if let previousTrendScore {
                    ((1.0 - trendAlpha) * previousTrendScore) + (trendAlpha * dailyScore)
                } else {
                    dailyScore
                }

            previousTrendScore = trendScore

            return SleepAlignmentScorePoint(
                date: record.date,
                dailyScore: clampedScore(dailyScore, maximumScore: maximumScore),
                trendScore: clampedScore(trendScore, maximumScore: maximumScore),
                durationScore: durationScore,
                timingScore: timingScore,
                phaseScore: phaseScore,
                consistencyScore: consistencyScore
            )
        }
    }

    func weekdayAverages(_ records: [SleepNightRecord]) -> [SleepWeekdayAverage] {
        var totals: [Int: (duration: Double, nights: Int)] = [:]

        for record in records {
            let weekday = record.weekday
            let current = totals[weekday] ?? (0, 0)
            totals[weekday] = (
                duration: current.duration + record.durationHours,
                nights: current.nights + 1
            )
        }

        return (1...7).map { weekday in
            let entry = totals[weekday]
            let nights = entry?.nights ?? 0
            let average =
                nights > 0 ? (entry?.duration ?? 0) / Double(nights) : 0

            return SleepWeekdayAverage(
                weekday: weekday,
                dayName: calendar.shortWeekdaySymbols[weekday - 1],
                averageHours: average,
                nights: nights
            )
        }
    }

    func durationBuckets(_ records: [SleepNightRecord]) -> [SleepDurationBucket] {
        let labels = ["<5h", "5-5.5h", "5.5-6h", "6-6.5h", "6.5-7h", "7-7.5h", "7.5-8h", "8h+"]
        guard !records.isEmpty else {
            return labels.map { SleepDurationBucket(label: $0, count: 0, share: 0) }
        }

        var counts = Array(repeating: 0, count: labels.count)
        for record in records {
            let duration = record.durationHours
            switch duration {
            case ..<5:
                counts[0] += 1
            case ..<5.5:
                counts[1] += 1
            case ..<6:
                counts[2] += 1
            case ..<6.5:
                counts[3] += 1
            case ..<7:
                counts[4] += 1
            case ..<7.5:
                counts[5] += 1
            case ..<8:
                counts[6] += 1
            default:
                counts[7] += 1
            }
        }

        return labels.enumerated().map { index, label in
            let count = counts[index]
            let share = Double(count) / Double(records.count)
            return SleepDurationBucket(label: label, count: count, share: share)
        }
    }

    func currentStreak() -> Int {
        let trackedDays = Set(records.map { calendar.startOfDay(for: $0.date) })
        let today = calendar.startOfDay(for: Date())

        var currentDay = today
        if !trackedDays.contains(today) {
            guard
                let yesterday = calendar.date(
                    byAdding: .day,
                    value: -1,
                    to: today
                ),
                trackedDays.contains(yesterday)
            else {
                return 0
            }
            currentDay = yesterday
        }

        var streak = 0
        while trackedDays.contains(currentDay) {
            streak += 1
            guard
                let previous = calendar.date(
                    byAdding: .day,
                    value: -1,
                    to: currentDay
                )
            else {
                break
            }
            currentDay = previous
        }

        return streak
    }

    func longestStreak() -> Int {
        guard !records.isEmpty else { return 0 }
        let uniqueDates = Array(
            Set(records.map { calendar.startOfDay(for: $0.date) })
        ).sorted()

        var longest = 1
        var current = 1

        for index in 1..<uniqueDates.count {
            let previous = uniqueDates[index - 1]
            let currentDate = uniqueDates[index]
            let dayDiff = calendar.dateComponents(
                [.day],
                from: previous,
                to: currentDate
            ).day ?? 0

            if dayDiff == 1 {
                current += 1
                longest = max(longest, current)
            } else {
                current = 1
            }
        }

        return longest
    }

    private static func canonicalSessions(
        from sessions: [BlockedProfileSession]
    ) -> [BlockedProfileSession] {
        let valid = sessions
            .filter { $0.endTime != nil && $0.isValidSession }
            .sorted { $0.startTime < $1.startTime }

        var bestSessionByDate: [Date: BlockedProfileSession] = [:]

        for session in valid {
            let date = session.sleepDate
            if let existing = bestSessionByDate[date] {
                if session.duration > existing.duration {
                    bestSessionByDate[date] = session
                }
            } else {
                bestSessionByDate[date] = session
            }
        }

        return bestSessionByDate.values.sorted { $0.sleepDate < $1.sleepDate }
    }

    private static func goalDurationHours(
        optimalSleepTime: Date?,
        optimalWakeTime: Date?
    ) -> Double {
        guard
            let optimalSleepTime,
            let optimalWakeTime
        else {
            return 8.0
        }

        let calendar = Calendar.current
        let sleepComponents = calendar.dateComponents(
            [.hour, .minute],
            from: optimalSleepTime
        )
        let wakeComponents = calendar.dateComponents(
            [.hour, .minute],
            from: optimalWakeTime
        )

        let sleepHour = Double(sleepComponents.hour ?? 22)
            + Double(sleepComponents.minute ?? 0) / 60.0
        let wakeHour = Double(wakeComponents.hour ?? 7)
            + Double(wakeComponents.minute ?? 0) / 60.0

        var duration = wakeHour - sleepHour
        if duration < 0 {
            duration += 24
        }
        return duration
    }

    private func consistencyScore(values: [Double]) -> Int {
        guard !values.isEmpty else { return 0 }
        let mean = values.reduce(0.0, +) / Double(values.count)
        let variance = values.map { pow($0 - mean, 2.0) }.reduce(0.0, +)
            / Double(values.count)
        let stdDev = sqrt(variance)
        return max(0, 100 - Int(stdDev * 40))
    }

    private func consistencyScore<C: Collection>(
        records: C,
        keyPath: KeyPath<SleepNightRecord, Double>
    ) -> Int where C.Element == SleepNightRecord {
        guard !records.isEmpty else { return 0 }

        let count = Double(records.count)
        let sum = records.reduce(0.0) { partial, record in
            partial + record[keyPath: keyPath]
        }
        let mean = sum / count

        let variance = records.reduce(0.0) { partial, record in
            let delta = record[keyPath: keyPath] - mean
            return partial + (delta * delta)
        } / count

        let stdDev = sqrt(variance)
        return max(0, 100 - Int(stdDev * 40))
    }

    private func scheduleAccuracyScoreInCollection<C: Collection>(_ records: C) -> Int
    where C.Element == SleepNightRecord {
        guard
            !records.isEmpty,
            let sleepTarget = targetSleepOffset,
            let wakeTarget = targetWakeOffset
        else {
            return 0
        }

        let totalDeviation = records.reduce(0.0) { partial, record in
            partial
                + abs(record.bedtimeOffset - sleepTarget)
                + abs(record.wakeOffset - wakeTarget)
        }

        let averageDeviation = totalDeviation / Double(records.count * 2)
        return max(0, 100 - Int(averageDeviation * 30.0))
    }

    private func average(_ values: [Double]) -> Double? {
        guard !values.isEmpty else { return nil }
        return values.reduce(0.0, +) / Double(values.count)
    }

    private func wrappedHourDifference(_ lhs: Double, _ rhs: Double) -> Double {
        let raw = abs(lhs - rhs).truncatingRemainder(dividingBy: 24)
        return min(raw, 24 - raw)
    }

    private func durationAlignmentScore(
        actualHours: Double,
        targetHours: Double
    ) -> Double {
        let scale = actualHours <= targetHours ? 1.25 : 2.0
        let deviation = abs(actualHours - targetHours)
        return exp(-pow(deviation / scale, 2.0))
    }

    private func timingAlignmentScore(
        record: SleepNightRecord,
        targetSleepOffset: Double,
        targetWakeOffset: Double
    ) -> Double {
        let actualStart = record.bedtimeOffset
        let actualEnd = record.bedtimeOffset + record.durationHours
        let overlapHours = max(
            0.0,
            min(actualEnd, targetWakeOffset) - max(actualStart, targetSleepOffset)
        )
        let outsideWindowHours = max(0.0, record.durationHours - overlapHours)
        let overlapScore = overlapHours / max(targetDurationHours, 0.01)
        return clamp(overlapScore - (0.15 * outsideWindowHours), lower: 0, upper: 1)
    }

    private func phaseAlignmentScore(
        actualMidpoint: Double,
        targetMidpoint: Double
    ) -> Double {
        let deviation = wrappedHourDifference(actualMidpoint, targetMidpoint)
        return exp(-0.5 * pow(deviation / 1.5, 2.0))
    }

    private func consistencyAlignmentScore<C: Collection>(_ records: C) -> Double
    where C.Element == SleepNightRecord {
        guard records.count >= 2 else { return 1.0 }

        let midpointStdDev = standardDeviation(records.map(\.midpointOffset))
        let durationStdDev = standardDeviation(records.map(\.durationHours))
        return exp(
            -0.5
                * (
                    pow(midpointStdDev / 1.25, 2.0)
                        + pow(durationStdDev / 1.5, 2.0)
                )
        )
    }

    private func extrapolatedAlignmentScore(_ components: [(score: Double, weight: Double)])
        -> Double
    {
        let activeComponents = components.compactMap { component -> (score: Double, weight: Double)? in
            let score = clamp(component.score, lower: 0, upper: 1)
            guard score > minimumIncludedComponentScore, component.weight > 0 else { return nil }
            return (score: score, weight: component.weight)
        }
        let activeWeight = activeComponents.reduce(0.0) { $0 + $1.weight }
        guard activeWeight > 0 else { return 0 }

        return activeComponents.reduce(1.0) { product, component in
            product * pow(component.score, component.weight / activeWeight)
        }
    }

    private func standardDeviation(_ values: [Double]) -> Double {
        guard values.count >= 2 else { return 0 }
        let mean = values.reduce(0.0, +) / Double(values.count)
        let variance = values.reduce(0.0) { partial, value in
            partial + pow(value - mean, 2.0)
        } / Double(values.count)
        return sqrt(variance)
    }

    private func clampedScore(_ value: Double, maximumScore: Double) -> Double {
        clamp(value, lower: 0, upper: maximumScore)
    }

    private func clamp(_ value: Double, lower: Double, upper: Double) -> Double {
        min(max(value, lower), upper)
    }
}
