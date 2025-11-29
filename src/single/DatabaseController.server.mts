import { STORAGE_DB_FILE_PATH } from "@data/paths.mts"
import { Sequelize, DataTypes } from "sequelize"
import { User } from "@class/model/User.server.mjs";
import { Cuenta } from "@class/model/Cuenta.server.mjs";
import { Subcuenta } from "@class/model/Subcuenta.server.mjs";

// crear base de datos
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: STORAGE_DB_FILE_PATH, // Ruta del archivo SQLite
    logging: (msg) => {
        // Solo loguea si el mensaje contiene "ERROR"
        if (msg.includes('ERROR')) {
            console.error(msg)
        }
    }
})

// crear tablas
User.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.STRING
        }
    }, {
        sequelize: sequelize
    }
)
Cuenta.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING
        },
        owner: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: User,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
    }, {
        sequelize: sequelize
    }
)
Subcuenta.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING
        },
        cuenta: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: Cuenta,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        // metalico
        cincuenta: {
            type: DataTypes.INTEGER
        },
        veinte: {
            type: DataTypes.INTEGER
        },
        diez: {
            type: DataTypes.INTEGER
        },
        cinco: {
            type: DataTypes.INTEGER
        },
        uno: {
            type: DataTypes.INTEGER
        },
        cerocincuenta: {
            type: DataTypes.INTEGER
        },
        ceroveinte: {
            type: DataTypes.INTEGER
        },
        cerodiez: {
            type: DataTypes.INTEGER
        },
        cerocinco: {
            type: DataTypes.INTEGER
        },
        cerodos: {
            type: DataTypes.INTEGER
        },
        cerouno: {
            type: DataTypes.INTEGER
        }
        // end metalico
    }, {
        sequelize: sequelize
    }
)


// relaciones entre tablas
User.hasMany(Cuenta, { foreignKey: 'owner' })
Cuenta.belongsTo(User, { foreignKey: 'owner' })

Cuenta.hasMany(Subcuenta, { foreignKey: 'cuenta' })
Subcuenta.belongsTo(Cuenta, { foreignKey: 'cuenta' })

/**
 * Controlador de la base de datos
 */
export let DatabaseController = {
    sequelize: sequelize,

    /**
     * Sincroniza la base de datos (revisar las tablas y crearlas)
     * 
     * @returns true
     */
    sync: async () => {
        // await User.sync()
        // await Cuenta.sync()
        // await Subcuenta.sync()
        await sequelize.sync()
    }
}