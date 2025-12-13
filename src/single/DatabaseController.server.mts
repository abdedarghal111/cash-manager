import { STORAGE_DB_FILE_PATH } from "@data/paths.mjs"
import { Sequelize, DataTypes } from "sequelize"
import { User } from "@class/model/User.server.mjs"
import { Cuenta } from "@class/model/Cuenta.server.mjs"
import { Subcuenta } from "@class/model/Subcuenta.server.mjs"
import { Movimiento, TipoMovimiento } from "@class/model/Movimiento.server.mjs"
import { SaldoPendiente } from "@class/model/SaldoPendiente.server.mjs"
import { Expense } from "@class/model/Expense.server.mjs"
import { TipoGasto } from "@data/ExpenseType.mjs"

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


SaldoPendiente.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
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
})

// crear tablas
User.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    pendingTotalSubaccount: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: SaldoPendiente,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    username: {
        type: DataTypes.STRING(50)
    },
    password: {
        type: DataTypes.STRING(255)
    }
}, {
    sequelize: sequelize
})

Cuenta.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(50)
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
})

Subcuenta.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(50)
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    cashPending: {
        type: DataTypes.FLOAT,
        allowNull: false
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
})

Movimiento.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        cuentaId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: Cuenta,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM(...Object.values(TipoMovimiento)),
            allowNull: false
        },
        // el concepto del movimiento:
        description: {
            type: DataTypes.STRING(500),
            allowNull: false
        }
    }, {
    sequelize: sequelize,
    tableName: 'movimientos',
    timestamps: true
}
)

Expense.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(50)
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
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM(...Object.values(TipoGasto)),
        allowNull: false
    }
}, {
    sequelize: sequelize
})

// relaciones entre tablas
User.hasMany(Cuenta, { foreignKey: 'owner' })
Cuenta.belongsTo(User, { foreignKey: 'owner' })

User.hasMany(Expense, { foreignKey: 'owner' })
Expense.belongsTo(User, { foreignKey: 'owner' })

User.hasOne(SaldoPendiente, { foreignKey: 'pendingTotalSubaccount' })
SaldoPendiente.belongsTo(User, { foreignKey: 'pendingTotalSubaccount' })

Cuenta.hasMany(Subcuenta, { foreignKey: 'cuenta' })
Subcuenta.belongsTo(Cuenta, { foreignKey: 'cuenta' })

Cuenta.hasMany(Movimiento, { foreignKey: 'cuentaId' })
Movimiento.belongsTo(Cuenta, { foreignKey: 'cuentaId' })

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
        // await Movimiento.sync()
        // configuración para la sincronización HAY QUE TENER CUIDADO, posible delete from sin querer
        await sequelize.sync({
            alter: {
                // que altere las tablas sin borrar (por defecto borra la tabla)
                drop: false
            }
        })
    }
}