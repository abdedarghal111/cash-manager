import { STORAGE_DB_FILE_PATH } from "@data/paths.mjs"
import { Sequelize, DataTypes } from "sequelize"
import { User } from "@class/model/User.server.mjs"
import { Cuenta } from "@class/model/Cuenta.server.mjs"
import { Subcuenta } from "@class/model/Subcuenta.server.mjs"
import { Movimiento, TipoMovimiento } from "@class/model/Movimiento.server.mjs"
import { Monto } from "@class/model/Monto.server.mjs"
import { Expense } from "@class/model/Expense.server.mjs"
import { TipoGasto } from "@data/enums/ExpenseType.mjs"

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
Monto.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
     // metalico
    cincuenta: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    veinte: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    diez: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cinco: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    uno: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cerocincuenta: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    ceroveinte: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cerodiez: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cerocinco: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cerodos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cerouno: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
    // end metalico
}, {
    sequelize: sequelize
})

User.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    pendingMonto: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: Monto,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        type: DataTypes.STRING(50),
        defaultValue: ''
    },
    percentage: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    isRemainder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    ignore: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    owner: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: User,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        type: DataTypes.STRING(50),
        defaultValue: ''
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    cashPending: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    cuenta: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: Cuenta,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    monto: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: Monto,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
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
        transactionGroupUid: {
            type: DataTypes.STRING(36),
            defaultValue: ''
        },
        transactionDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        fromCuenta: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: Cuenta,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: true
        },
        toCuenta: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: Cuenta,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: true
        },
        monto: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: {
                model: Monto,
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        type: {
            type: DataTypes.ENUM(...Object.values(TipoMovimiento)),
            allowNull: false,
            defaultValue: TipoMovimiento.INGRESO
        },
        // el concepto del movimiento:
        description: {
            type: DataTypes.STRING(500),
            allowNull: false,
            defaultValue: ''
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
        type: DataTypes.STRING(50),
        defaultValue: ''
    },
    owner: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: User,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    type: {
        type: DataTypes.ENUM(...Object.values(TipoGasto)),
        allowNull: false,
        defaultValue: TipoGasto.MENSUAL
    }
}, {
    sequelize: sequelize
})

// relaciones entre tablas
User.hasMany(Cuenta, { foreignKey: 'owner' })
Cuenta.belongsTo(User, { foreignKey: 'owner' })

User.hasMany(Expense, { foreignKey: 'owner' })
Expense.belongsTo(User, { foreignKey: 'owner' })

User.hasOne(Monto, { foreignKey: 'pendingMonto' })
Monto.belongsTo(User, { foreignKey: 'pendingMonto' })

Cuenta.hasMany(Subcuenta, { foreignKey: 'cuenta' })
Subcuenta.belongsTo(Cuenta, { foreignKey: 'cuenta' })

Subcuenta.hasOne(Monto, { foreignKey: 'monto' })
Monto.belongsTo(Subcuenta, { foreignKey: 'monto' })

Cuenta.hasMany(Movimiento, { foreignKey: 'fromCuenta' })
Movimiento.belongsTo(Cuenta, { foreignKey: 'fromCuenta' })

Cuenta.hasMany(Movimiento, { foreignKey: 'toCuenta' })
Movimiento.belongsTo(Cuenta, { foreignKey: 'toCuenta' })

Movimiento.hasOne(Monto, { foreignKey: 'monto' })
Monto.belongsTo(Movimiento, { foreignKey: 'monto' })

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