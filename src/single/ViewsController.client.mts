/**
 * A singleton class that manages the views
 * 
 * exports the 'currentView' variable that is used in @src/App.svelte
 * and manages it for setting the current view
 */

import { get, writable } from 'svelte/store'
import { Parameters } from '@class/Parameters.mjs'
import { Component } from 'svelte'
import SetupView from '@routes/setup.view.svelte'

// expose the variable for use in @src/App.svelte and reactivity
export let currentView = writable<Component>(SetupView)

export const ViewsController = {
    // The current path to a view or view component
    currentView: currentView,
    
    // The parameters of the current view
    parameters: new Parameters(),

    // si la vista anterior envia a otra vista
    previousReturnView: null as null|Component,

    // los parametros de la vista anterior
    previousReturnParameters: null as null|Parameters,

    /**
     * Vuelve a la vista por defecto o a la vista anterior si se ha establecido
     * 
     * @param newParameters Los parámetros de la vista, por defecto sin parámetros
     */
    setDefaultCurrentView: function(view: Component, newParameters?: Parameters): void {
        // si existe vista anterior definida entonces volver a ella
        if (this.previousReturnView) {
            this.setCurrentView(
                this.previousReturnView,
                this.previousReturnParameters ?? new Parameters() // si no existen parámetros enviar vacío
            )
            // vuelto a la vista, limpiar
            this.previousReturnView = null
            this.previousReturnParameters = null
            return
        }
        
        // si no existe vista anterior entonces volver a la por defecto
        this.setCurrentView(view, newParameters)
    },

    /**
     * Establece la vista actual y sus parámetros
     * 
     * @param view El componente de la vista
     * @param newParameters Los parámetros de la vista, por defecto sin parámetros.
     */
    setCurrentView: function(view: Component, newParameters: Parameters = new Parameters()): void {
        this.parameters = newParameters
        this.currentView.set(view)
    },

    /**
     * Establece la vista a volver y sus parámetros
     * 
     * @param view El componente de la vista
     * @param newParameters Los parámetros de la vista, por defecto sin parámetros.
     */
    setReturnView: function(view: Component, newParameters?: Parameters): void {
        this.previousReturnView = view
        this.previousReturnParameters = newParameters ?? null
    },

    /**
     * Devuelve los parámetros de la vista actual
     * 
     * @returns Los parámetros de la vista actual
     */
    getParameters: function(): Parameters {
        return this.parameters
    },

    /**
     * Devuelve el componente de la vista actual
     * 
     * @returns El componente de la vista actual
     */
    getCurrentView: function(): Component {
        return get(this.currentView)
    }
}
