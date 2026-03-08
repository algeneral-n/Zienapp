/**
 * OwnerDashboard — renders the full FounderPage with built-in routing.
 */
import React from 'react';
import FounderPage from './FounderPage';
import GuidedTour from '../components/GuidedTour';
import { TOUR_STEPS } from '../constants/tourSteps';

export default function OwnerDashboard() {
    return (
        <>
            <FounderPage />
            <GuidedTour tourKey="owner_dashboard" steps={TOUR_STEPS.owner_dashboard || []} />
        </>
    );
}
