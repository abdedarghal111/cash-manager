/**
 * Client only
 * 
 * A singleton class that manages the views
 * 
 * exports the 'currentView' variable that is used in @src/App.svelte
 * and manages it for setting the current view
 */

import { get, writable } from 'svelte/store';
import { Parameters } from '@class/Parameters.mts';
import { Component } from 'svelte';
import LandingView from '@routes/landing.view.svelte';

// expose the variable for use in @src/App.svelte and reactivity
export let currentView = writable<Component>(LandingView)

export const ViewsController = {
    // The current path to a view or view component
    currentView: currentView,

    // The parameters of the current view
    parameters: new Parameters(),

    /**
     * Sets the current view and parameters
     * 
     * @param view The view component
     * @param newParameters The parameters of the view, defaults to no parameters
     */
    setCurrentView: function(view: Component, newParameters: Parameters = new Parameters()): void {
        this.parameters = newParameters
        this.currentView.set(view)
    },

    /**
     * Returns the parameters of the current view
     * 
     * @returns The parameters of the current view
     */
    getParameters: function(): Parameters {
        return this.parameters
    },

    /**
     * Returns the current component
     * 
     * @returns The current component
     */
    getCurrentView: function(): Component {
        return get(this.currentView)
    }
}
